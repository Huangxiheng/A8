# 项目开发状态与架构文档

## 项目概述

Seeyon A8+（V8.1SP2 集团版）系统的 TypeScript API 客户端封装库。目标是通过 Node.js 程序化调用 A8+ 系统的各功能 API。

## 当前实现状态

### ✅ 登录认证（已完成）

**源码**：`src/lib/seeyon-client.ts`

#### 登录流程

```
1. GET  /main.do?method=updateLoginSeed  → 获取加密种子 + JSESSIONID
2. DES加密密码：CryptoJS.DES.encrypt(CryptoJS.enc.Utf8.parse(password), seed)
3. POST /main.do?method=login            → 携带 JSESSIONID Cookie + 加密密码
4. 判断登录成功：响应体以 "ok" 开头 或 响应头 loginok=ok
```

#### 关键实现细节

1. **Cookie 管理**：手动从 `Set-Cookie` 响应头提取 JSESSIONID，通过 `buildHeaders()` 方法在请求头中携带 `Cookie: JSESSIONID=xxx`。不使用 CookieJar/tough-cookie。
2. **Session 与加密种子绑定**：`updateLoginSeed` 响应会创建一个新的 session 并在 `Set-Cookie` 中返回 JSESSIONID，该 session 与返回的加密种子绑定。后续登录请求必须携带此 JSESSIONID，否则服务器无法匹配加密种子，导致登录失败。
3. **登录成功检测**：服务器对登录请求返回 302 重定向（Location: /seeyon/indexOpenWindow\.jsp），响应体为空。通过响应头 `loginok: ok` 判断登录成功。AJAX 方式登录时响应体以 `"ok"` 开头。
4. **Cookie 头设置方式**：不能通过 axios 拦截器设置 Cookie 头（axios 会过滤拦截器中的 Cookie 头），必须在请求配置中直接构建包含 Cookie 的 headers 对象传入。

#### 表单字段

| 字段                          | 值                                                               |
| --------------------------- | --------------------------------------------------------------- |
| `login_username`            | 用户名                                                             |
| `login_password`            | DES 加密后的密码                                                      |
| `loginFrom`                 | 固定值 `loginPortal`                                               |
| `login.timezone`            | 时区 ID（通过 `Intl.DateTimeFormat().resolvedOptions().timeZone` 获取） |
| `login.validatePwdStrength` | 密码强度校验级别，固定 `3`                                                 |
| `fontSize`                  | 固定 `12`                                                         |
| `screenWidth`               | 固定 `1920`                                                       |
| `screenHeight`              | 固定 `1080`                                                       |

#### SeeyonClient 类 API

```typescript
// 配置
interface SeeyonClientConfig {
  baseURL: string;   // 服务器基础地址，如 http://120.35.0.67:28101/seeyon
  timeout?: number;  // 请求超时（毫秒），默认 30000
  debug?: boolean;   // 是否打印请求/响应日志，默认 true
}

// 登录结果
interface LoginResult {
  success: boolean;
  message?: string;
  sessionId?: string;  // 登录成功后的 JSESSIONID
}

// 使用示例
const client = new SeeyonClient({ baseURL: 'http://...' });
const result = await client.login('username', 'password');
```

### ✅ 待办事项查询（已完成）

**源码**：`src/lib/seeyon-client.ts`

**参考文档**：`.trae/docs/todo/Todo_List_Page_Analysis.md`

#### API 接口

```typescript
// 查询参数
interface PendingListParams {
  page?: number;            // 页码，从1开始，默认1
  size?: number | string;   // 每页数量，默认200
  subject?: string;         // 标题（模糊查询）
  importantLevel?: string;  // 重要程度
  createDate?: string;      // 创建日期
  templateName?: string;    // 模板名称
  startMemberName?: string; // 发起人姓名
  preApproverName?: string; // 上一处理人姓名
  receiveDate?: string;     // 接收日期
  subState?: string;        // 子状态
  isOverdue?: string;       // 是否超期
  // ... 其他查询条件
}

// 查询结果
interface PendingListResult {
  total: number;          // 总数
  pages: number;          // 总页数
  data: PendingItem[];    // 待办列表
  size: number;           // 每页数量
  showTotal: boolean;     // 是否显示总数
  page: number;           // 当前页码
}

// 使用示例
const pendingList = await client.getPendingList({
  page: 1,
  size: 20,
  subject: '审批'
});
```

#### 实现细节

1. **请求端点**：`POST /ajax.do?method=ajaxAction&managerName=colManager&rnd={随机数}`
2. **请求参数构造**：
   - `managerMethod`: 固定值 `getPendingList`
   - `arguments`: JSON数组 `[分页参数对象, 查询条件对象]`
   - 分页参数：`{page: number, size: string}`
   - 查询条件：所有字段默认值为空字符串，`deduplication` 和 `aiProcessing` 默认 `false`
3. **请求头要求**：
   - `Content-Type`: `application/x-www-form-urlencoded;charset=UTF-8`
   - `requesttype`: `AJAX`（必需，否则服务器可能拒绝请求）
   - `Cookie`: `JSESSIONID=xxx`（必须先登录）
4. **登录状态检查**：方法内部会检查 `sessionId` 是否存在，未登录会抛出错误

#### 返回数据结构

单个待办事项（PendingItem）包含60+字段，主要分为：

- **基本信息**：affairId、subject、startMemberName、startDate、createDate、receiveTime
- **流程信息**：processId、summaryId、caseId、workitemId、templeteId、activityId
- **状态信息**：state、subState、subStateName、affairState、readState、flowFinished
- **节点信息**：nodeName、affairNodeName、nodeDeadLineName
- **权限信息**：canForward、canEdit、canReMove、canDeleteORarchive
- **时间信息**：deadLineDate、processDeadline、expectedProcessTime、dealTime
- **其他信息**：importantLevel、hasAttsFlag、isTrack、hasFavorite、proxy、grab等

### ✅ 请求/响应日志（已完成）

**源码**：`src/lib/logger.ts`

- `setupLogger(axiosInstance)` — 为 axios 实例安装请求/响应日志拦截器
- `safeStringify(obj, space?)` — 安全序列化对象为 JSON，使用 WeakSet 处理循环引用，处理二进制类型（ArrayBuffer/Buffer/Stream）
- 请求日志：method、URL、headers、params、data
- 响应日志：status、headers、data（字符串超 500 字符截断、对象用 safeStringify、二进制输出类型和大小）

## 项目技术架构

### 依赖

| 包名               | 版本      | 类型  | 用途           |
| ---------------- | ------- | --- | ------------ |
| axios            | ^1.18.1 | 运行时 | HTTP 请求      |
| crypto-js        | ^4.2.0  | 运行时 | DES 密码加密     |
| typescript       | ^5.8.3  | 开发  | 编译           |
| @types/crypto-js | ^4.2.2  | 开发  | 类型定义         |
| @types/node      | ^26.1.0 | 开发  | Node.js 类型定义 |
| tsx              | ^4.20.3 | 开发  | 运行 TS 脚本     |

### 编译配置

- `tsconfig.json`：`target: ES2020`, `module: commonjs`, `strict: true`, `declaration: true`
- 输入：`src/**/*`，输出：`dist/`
- `package.json`：`"type": "module"`, `"main": "dist/lib/index.js"`, `"types": "dist/lib/index.d.ts"`

### 源码文件结构

```
src/lib/
├── seeyon-client.ts   # SeeyonClient 类（login, updateSecuritySeed, encryptPassword, extractSessionId, buildHeaders）
├── logger.ts          # setupLogger 拦截器 + safeStringify 工具函数
└── index.ts           # 导出入口
```

## 已知问题与经验教训

1. **axios 拦截器无法设置 Cookie 头**：在 Node.js 环境中，axios 会过滤拦截器中设置的 `Cookie` 头。解决方案是在每个请求的配置中直接构建包含 Cookie 的 headers 对象。
2. **加密种子与 Session 绑定**：updateLoginSeed 返回的加密种子与服务器端 session 绑定，登录请求必须携带从 updateLoginSeed 响应获取的 JSESSIONID。
3. **302 重定向的登录响应**：登录 POST 返回 302 状态码，响应体为空，需通过 `loginok` 响应头判断登录结果。
4. **顶层 await**：`tsx` 在 commonjs 模式下不支持顶层 await，示例代码需使用 async IIFE 包装。

## 后续开发计划

### 待办事项查询 API（优先级：高）

**参考文档**：`.trae/docs/todo/Todo_List_Page_Analysis.md`

需要实现的接口：

- 带参数查询待办事项列表（`/seeyon/ajax.do?method=ajaxAction&managerName=colManager&rnd=65446`）

实现时需注意：

- 需要先调用 `login()` 获取 session
- 所有请求需携带 `Cookie: JSESSIONID=xxx`
- 生成含有所有请求示例字段parameter和formdata以及返回示例结果的结构，作为封装后的方法的参数

### 操作待办事项api（优先级：高）

**参考文档**：`.trae/docs/todo/Todo_Detail_Page_Analysis.md`

需要实现的接口：

- 获取当前用户所有待办列表（/collaboration.do?method=listPending）
- 获取待办详情（`/collaboration/collaboration.do?method=summary`）
- 提交审批意见（`/collaboration/collaboration.do?method=deal`）

实现时需注意：

- 需要先调用 `login()` 获取 session
- 所有请求需携带 `Cookie: JSESSIONID=xxx`
- 待办列表查询接口需要从主页面分析文档（`.trae/docs/main/Main_Page_Analysis.md`）中获取

### 报表数据查询 API（优先级：中）

**参考文档**：`.trae/docs/report/Report_Analysis_Page_Analysis.md`

需要实现的接口：

- 报表视图（`/vreport/vReport.do?method=vReportView`）
- 报表数据查询

### 流程审批 API（优先级：中）

**参考文档**：`.trae/docs/process/Process_Page_Analysis.md`

需要实现的接口：

- 流程预测（`/workflowPrediction.do?method=prediction`）
- 审批操作（提交/回退/移交）

### 文件上传下载 API（优先级：低）

需要实现的接口：

- 文件上传（`/seeyon/fileUpload.do`）
- 文件展示（`/seeyon/fileUpload.do?method=showRTE`）

