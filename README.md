# Seeyon A8+ API 客户端

Seeyon A8+ 系统的 TypeScript API 客户端封装库，提供登录、待办查询、报表查询等功能的封装。

## 项目结构

```
├── src/lib/                    # 核心库源码（TypeScript）
│   ├── seeyon-client.ts        # SeeyonClient 核心客户端类
│   ├── logger.ts               # axios 请求/响应日志拦截器
│   └── index.ts                # 模块导出入口
├── dist/lib/                   # 编译输出（JS + d.ts + sourcemap）
├── examples/
│   └── example.ts              # 使用示例
├── test/                       # 测试代码（待编写）
├── .trae/docs/                 # Seeyon A8+ 系统页面分析文档
├── .trae/documents/            # 开发计划与实施文档
├── tsconfig.json               # TypeScript 编译配置
└── package.json
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 运行示例

```bash
npm run example
```

### 编译

```bash
npm run build
```

## 使用方法

```typescript
import { SeeyonClient } from './src/lib';

const client = new SeeyonClient({
  baseURL: 'http://120.35.0.67:28101/seeyon',
  debug: true,   // 打印请求/响应日志，默认 true
  timeout: 30000, // 请求超时（毫秒），默认 30000
});

const result = await client.login('username', 'password');
// result: { success: boolean, message?: string, sessionId?: string }
```

## 已实现功能

### 登录认证（SeeyonClient.login）

登录流程严格复刻浏览器端行为：

1. **获取加密种子** — `GET /main.do?method=updateLoginSeed`，从响应 `Set-Cookie` 提取 JSESSIONID
2. **DES 加密密码** — `CryptoJS.DES.encrypt(CryptoJS.enc.Utf8.parse(password), seed)`
3. **提交登录** — `POST /main.do?method=login`，携带 JSESSIONID Cookie 和表单数据
4. **判断结果** — 检查响应体是否以 `"ok"` 开头，或响应头 `loginok` 是否为 `"ok"`（302 重定向场景）

关键实现细节：
- Cookie 管理：手动从 `Set-Cookie` 响应头提取 JSESSIONID，通过 `buildHeaders()` 在后续请求的 `Cookie` 头中携带（不使用 CookieJar）
- 加密种子与 Session 绑定：`updateLoginSeed` 响应的 JSESSIONID 必须在登录请求中携带，否则服务器无法匹配加密种子
- 登录成功检测：服务器返回 302 重定向时响应体为空，通过响应头 `loginok: ok` 判断；AJAX 方式登录时响应体以 `"ok"` 开头

### 请求/响应日志（logger）

- 通过 axios 拦截器自动记录完整请求（method/URL/headers/data）和响应（status/headers/data）
- `safeStringify()`：安全序列化对象为 JSON，使用 WeakSet 处理循环引用
- 响应体分类处理：字符串直接输出（超 500 字符截断）、对象用 safeStringify、二进制类型输出类型和大小

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| TypeScript | ^5.8.3 | 开发语言 |
| axios | ^1.18.1 | HTTP 请求 |
| crypto-js | ^4.2.0 | DES 密码加密 |
| tsx | ^4.20.3 | 运行 TS 脚本 |

编译配置：`target: ES2020`, `module: commonjs`, `strict: true`

## API 接口参考

### SeeyonClientConfig

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| baseURL | string | 是 | - | 服务器基础地址，如 `http://120.35.0.67:28101/seeyon` |
| timeout | number | 否 | 30000 | 请求超时时间（毫秒） |
| debug | boolean | 否 | true | 是否打印请求/响应日志 |

### LoginResult

| 属性 | 类型 | 说明 |
|------|------|------|
| success | boolean | 是否登录成功 |
| message | string | 结果消息 |
| sessionId | string | 登录成功后的 JSESSIONID |

### 导出

```typescript
export { SeeyonClient } from './seeyon-client';
export type { SeeyonClientConfig, LoginResult } from './seeyon-client';
export { safeStringify } from './logger';
```

## 文档

- **系统页面分析文档**：`.trae/docs/` — 包含登录、主页面、待办、流程、报表等模块的页面结构、DOM 元素、JS 函数、API 端点分析
- **开发计划文档**：`.trae/documents/` — 功能实施计划和架构决策

## 开发计划

- [ ] 待办事项查询 API（基于 `.trae/docs/todo/Todo_Detail_Page_Analysis.md`）
- [ ] 报表数据查询 API（基于 `.trae/docs/report/Report_Analysis_Page_Analysis.md`）
- [ ] 流程审批 API（基于 `.trae/docs/process/Process_Page_Analysis.md`）
- [ ] 文件上传下载 API