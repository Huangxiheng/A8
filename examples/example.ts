import {
  SeeyonClient,
  PERFORMANCE_TABLE_DESIGN_ID,
  PERFORMANCE_TABLE_FIELD,
  getCellValue,
  logger,
} from '../src/lib';

async function main() {
  const client = new SeeyonClient({
    baseURL: 'http://120.35.0.67:28101/seeyon',
    debug: true,
  });

  // 从环境变量读取用户名和密码，未配置时使用默认值
  const username = process.env.SEYON_USERNAME || 'your_username';
  const password = process.env.SEYON_PASSWORD || 'your_password';
  
  // 登录
  const loginResult = await client.login(username, password);
  logger.info(`登录结果: ${JSON.stringify(loginResult)}`);

  if (!loginResult.success) {
    return;
  }

  // 查询待办列表
  logger.info('正在查询待办列表...');
  const pendingList = await client.getPendingList({
    page: 1,
    size: 200,
  });
  logger.info(`待办总数: ${pendingList.total}`);

  // 使用待办列表最后一项查询待办详情
  if (pendingList.data.length > 0) {
    const lastItem = pendingList.data[pendingList.data.length - 1];
    logger.info('--- 待办列表最后一项 ---');
    logger.info(`affairId: ${lastItem.affairId}`);
    logger.info(`subject: ${lastItem.subject}`);
    logger.info(`startMemberName: ${lastItem.startMemberName}`);

    logger.info('正在查询待办详情...');
    const detail = await client.getTodoDetail({
      affairId: lastItem.affairId,
    });
    logger.info('--- 待办详情（从 HTML 中提取的关键变量） ---');
    logger.info(`rightId: ${detail.rightId}`);
    logger.info(`zwIframeModuleId: ${detail.zwIframeModuleId}`);
    logger.info(`templateId: ${detail.templateId}`);
    logger.info(`templateProcessId: ${detail.templateProcessId}`);
    logger.info(`_contextProcessId: ${detail._contextProcessId}`);
    logger.info(`_summaryProcessId: ${detail._summaryProcessId}`);
    logger.info(`rawHtml 长度: ${detail.rawHtml.length} 字符`);
  } else {
    logger.info('待办列表为空，跳过详情查询');
  }

  logger.info('正在查询【财信】运维工单全量表-效能 报表...');
  const tableResult = await client.queryTableResult({
    designId: PERFORMANCE_TABLE_DESIGN_ID,
    page: 1,
    size: 50,
    userConditions: [
      {
        fieldName: PERFORMANCE_TABLE_FIELD.DEV_ORDER_NUMBER,
        fieldValue: 'KFXQ-CX-2026040100180',
        operation: 'Like',
      },
    ],
  });

  logger.info(`报表查询成功: ${tableResult.success}`);
  logger.info(`总数: ${tableResult.total}, 页数: ${tableResult.pages}`);
  logger.info(`字段数量: ${tableResult.fields.length}`);

  // 遍历数据行，按字段 display 名输出
  for (const row of tableResult.data) {
    logger.info('--- 行数据 ---');
    for (const field of tableResult.fields) {
      const value = getCellValue(row, field);
      logger.info(`${field.display}: ${value ?? ''}`);
    }
  }
}

main().catch((err) => logger.error(err));
