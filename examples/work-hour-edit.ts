import * as fs from "node:fs";

import { chromium, type Frame, type Locator, type Page } from "playwright";

import { logger } from "../src/lib";

const TARGET_URL = "http://120.35.0.67:28101/seeyon/main.do?method=index";

/** 通过 JS 直接赋值并触发 input/change 事件（用于 readonly 或隐藏控件） */
async function jsSetValue(loc: Locator, value: string): Promise<void> {
  await loc.evaluate((el, v) => {
    const input = el as unknown as HTMLInputElement;
    input.value = v;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.blur();
  }, value);
}

/** 在所有 frame 中按 CSS 选择器定位真实可见的输入控件并填写，返回命中的 scope */
async function fillBySelector(
  page: Page,
  selector: string,
  value: string,
  label: string,
): Promise<Page | Frame | null> {
  for (const s of [page, ...page.frames()]) {
    const ctrls = s.locator(selector);
    const total = await ctrls.count();
    // 逐个按计算样式判断真实可见（isVisible 不考虑 opacity:0），不依赖文档顺序
    for (let i = 0; i < total; i++) {
      const ctrl = ctrls.nth(i);
      const visible = await ctrl
        .evaluate((el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            Number(style.opacity) > 0 &&
            rect.width > 0 &&
            rect.height > 0
          );
        })
        .catch(() => false);
      if (!visible) continue;
      try {
        await ctrl.fill(value);
      } catch {
        await jsSetValue(ctrl, value);
      }
      await ctrl.evaluate((el) => {
        el.dispatchEvent(new Event("change", { bubbles: true }));
        (el as HTMLElement).blur();
      });
      // 回读校验，未生效时用 JS 赋值兜底
      let current = await ctrl.inputValue().catch(() => "");
      if (current !== value) {
        await jsSetValue(ctrl, value);
        current = await ctrl.inputValue().catch(() => "");
      }
      logger.info(`已填写 ${label}="${current}"（${selector}）`);
      return s;
    }
  }
  return null;
}

async function main() {
  logger.info(`启动 Chromium 并打开页面: ${TARGET_URL}`);

  // 有界面模式启动，便于观察页面加载过程
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
  });
  const page = await context.newPage();

  await page.goto(TARGET_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  // 等待网络空闲，尽量让页面资源加载完成（Seeyon 页面资源较多，超时不视为失败）
  await page
    .waitForLoadState("networkidle", { timeout: 30_000 })
    .catch(() => logger.warn("网络未在超时时间内空闲，继续执行"));

  // 从环境变量读取用户名和密码，未配置时使用默认值
  const username = process.env.SEYON_USERNAME || "1000664";
  const password = process.env.SEYON_PASSWORD || "qwer1234!";

  // 填写登录表单并点击“登 录”按钮
  logger.info("填写登录表单并点击登录...");
  await page.locator('input[name="login_username"]').fill(username);
  await page.locator('input[name="login_password1"]').fill(password);
  await page.locator("input#login_button").click();

  // 等待登录后主界面加载完成（超时不视为失败）
  await page
    .waitForLoadState("networkidle", { timeout: 60_000 })
    .catch(() => logger.warn("登录后网络未在超时时间内空闲，继续执行"));

  logger.info(`页面标题: ${await page.title()}`);
  logger.info(`当前地址: ${page.url()}`);

  // 截图保存
  await page.screenshot({ path: "examples/main-page.png", fullPage: true });
  logger.info("已保存截图: examples/main-page.png");

  // 点击左侧菜单：工时管理 -> [填写]个人工时报告
  logger.info("点击 工时管理 -> [填写]个人工时报告...");
  // 工时管理为一级菜单，子菜单由 JS 在 mouseenter 时控制显隐，需先悬停触发
  await page.locator('div.lev1Title[title="工时管理"]').hover();
  // 子菜单默认 display:none，悬停后等待其展开
  const reportMenu = page.locator('div.lev2Title[title="[填写]个人工时报告"]');
  await reportMenu.waitFor({ state: "visible", timeout: 10_000 });
  // 菜单点击可能在新窗口打开页面，提前监听 popup
  const popupPromise = context
    .waitForEvent("page", { timeout: 10_000 })
    .catch(() => null);
  await reportMenu.click();
  const popup = await popupPromise;
  const reportPage = popup ?? page;

  await reportPage
    .waitForLoadState("networkidle", { timeout: 60_000 })
    .catch(() => logger.warn("工时报告页面网络未在超时时间内空闲，继续执行"));

  logger.info(`工时报告页面标题: ${await reportPage.title()}`);
  logger.info(`工时报告页面地址: ${reportPage.url()}`);

  await reportPage.screenshot({
    path: "examples/work-hour-report-page.png",
    fullPage: true,
  });
  logger.info("已保存截图: examples/work-hour-report-page.png");

  // 等待数据填充区域加载完成，并点击第一项的“复制至当前模板”
  logger.info("等待数据填充区域加载...");
  const dataAreaSelector = "div#dataRelation_body";
  // 真实数据项带 pid 属性；display_none 中的模板项无 pid
  const firstItemSelector = "li.list_li[pid]";

  // 数据区域可能嵌在 iframe 中：在主文档与所有 frame 并行等待“数据项可见”，按顺序取第一个命中者
  const candidates: (Page | Frame)[] = [reportPage, ...reportPage.frames()];
  const hits = await Promise.all(
    candidates.map(async (s) => {
      try {
        await s
          .locator(dataAreaSelector)
          .locator(firstItemSelector)
          .first()
          .waitFor({ state: "visible", timeout: 5_000 });
        return s;
      } catch {
        return null;
      }
    }),
  );
  const dataScope = hits.find((s): s is Page | Frame => s !== null);
  if (!dataScope) {
    // 输出各 frame 的诊断信息，便于定位结构差异
    for (const f of reportPage.frames()) {
      const area = f.locator(dataAreaSelector);
      if ((await area.count()) === 0) continue;
      const html = await area.innerHTML().catch(() => "");
      logger.warn(`数据区域诊断 frame=${f.url()} HTML=${html.slice(0, 1500)}`);
    }
    await reportPage.screenshot({
      path: "examples/work-hour-data-debug.png",
      fullPage: true,
    });
    throw new Error("数据填充区域未出现可见数据项");
  }
  logger.info(`数据区域所在 frame: ${dataScope.url()}`);

  const dataArea = dataScope.locator(dataAreaSelector);
  const firstItem = dataArea.locator(firstItemSelector).first();
  logger.info(
    `数据已加载，共 ${await dataArea.locator(firstItemSelector).count()} 项，第一项: ${await firstItem.getAttribute("title")}`,
  );

  // “复制至当前模板”按钮由 CSS 控制悬停显示，实际点击仍判定不可见；
  // 改为直接派发 click 事件触发 onclick="copyFormData(this,event)"，无需按钮可见
  await firstItem.scrollIntoViewIfNeeded();
  await firstItem
    .locator('span.copyToLeftHover[title="复制至当前模板"]')
    .dispatchEvent("click");
  logger.info("已点击第一项的 复制至当前模板");

  await reportPage
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => logger.warn("复制后网络未在超时时间内空闲，继续执行"));
  await reportPage.screenshot({
    path: "examples/work-hour-copy-result.png",
    fullPage: true,
  });
  logger.info("已保存截图: examples/work-hour-copy-result.png");

  // 将所有包含表单控件的 frame 的 HTML 保存到本地，便于后续精确定位字段结构
  const dumpDir = ".trae/docs/workhour/form-frames";
  fs.mkdirSync(dumpDir, { recursive: true });
  let dumpIndex = 0;
  for (const f of reportPage.frames()) {
    const controlCount = await f
      .locator("input, textarea, select")
      .count()
      .catch(() => 0);
    if (controlCount === 0) continue;
    const html = await f.content().catch(() => "");
    if (!html) continue;
    const name = `${String(dumpIndex).padStart(2, "0")}_${
      f
        .url()
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .slice(-60) || "frame"
    }.html`;
    fs.writeFileSync(`${dumpDir}/${name}`, html);
    logger.info(
      `已保存 frame（${controlCount} 个控件）: ${dumpDir}/${name} url=${f.url()}`,
    );
    dumpIndex += 1;
  }

  // 复制完成后重新读取 DOM 填写表单：工时日期=当前日期（yyyy-MM-dd），工时总体内容=无
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  // 工时日期：显示框 id 形如 field0049_<随机token>_format，token 每次会话变化，
  // 用前缀 field0049_ + 后缀 _format 锚定。cap4-date 加载后即处于编辑态（__cnt 内含可见
  // 输入框），必须先填写：若先激活文本域，日期控件会被收起导致输入框从 DOM 消失
  const dateSelector = 'input[id^="field0049_"][id$="_format"]';
  const dateScope = await fillBySelector(
    reportPage,
    dateSelector,
    today,
    "工时日期",
  );
  if (!dateScope) throw new Error("未定位到“工时日期”输入框");
  // 同步隐藏的基础值输入框（id 为显示框去掉 _format 后缀，display:none，表单实际提交值）
  const fmtId = await dateScope
    .locator(dateSelector)
    .first()
    .getAttribute("id");
  if (fmtId) {
    const baseField = dateScope
      .locator(`input#${fmtId.replace(/_format$/, "")}`)
      .first();
    if ((await baseField.count()) > 0) await jsSetValue(baseField, today);
  }

  // 工时总体内容：cap4 文本域默认渲染为浏览态（__browse 下仅 opacity:0 隐藏框），
  // 需先点击内容区激活编辑态，待 __cnt 内 textarea 出现后再按真实可见过滤填写
  for (const s of [reportPage, ...reportPage.frames()]) {
    const browse = s.locator("#field0004_id .cap4-textarea__browse").first();
    if ((await browse.count()) === 0) continue;
    await browse.click().catch(() => {});
    await s
      .locator("#field0004_id .cap4-textarea__cnt textarea")
      .first()
      .waitFor({ state: "attached", timeout: 5000 })
      .catch(() => logger.warn("编辑态文本域未在超时内出现，继续尝试直接填写"));
    break;
  }
  const contentScope = await fillBySelector(
    reportPage,
    "#field0004_id .cap4-textarea__cnt textarea",
    "无",
    "工时总体内容",
  );
  if (!contentScope) throw new Error("未定位到“工时总体内容”输入框");

  // 点击“发送”（可能在表单 frame 或外层文档中）
  let sendBtn: Locator | null = null;
  for (const s of [reportPage, ...reportPage.frames()]) {
    const loc = s.getByText("发送", { exact: true }).first();
    if ((await loc.count()) > 0 && (await loc.isVisible().catch(() => false))) {
      sendBtn = loc;
      break;
    }
  }
  if (!sendBtn) throw new Error("未找到发送按钮");
  await sendBtn.click();
  logger.info("已点击");

  await reportPage.waitForTimeout(3_000);
  await reportPage.screenshot({
    path: "examples/work-hour-send.png",
    fullPage: true,
  });
  logger.info("已保存截图: examples/work-hour-send.png");

  //保持浏览器打开 10 秒，便于查看页面
  await page.waitForTimeout(3_000);

  await browser.close();
  logger.info("浏览器已关闭");
}

main().catch((err) => {
  logger.error(`运行失败: ${err}`);
  process.exitCode = 1;
});
