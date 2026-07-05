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

### 待办事项查询（SeeyonClient.getPendingList）

查询当前用户的待办事项列表：

```typescript
const pendingList = await client.getPendingList({
  page: 1,          // 页码，从1开始
  size: 20,         // 每页数量，默认200
  subject: '',      // 标题（模糊查询）
  // ... 其他查询条件
});
```

API 详情：

- **请求端点**：`POST /ajax.do?method=ajaxAction&managerName=colManager`
- **请求参数**：支持分页（page、size）和多种查询条件（subject、importantLevel、createDate等）
- **响应数据**：返回待办事项列表，包含总数、页数、待办详情等信息

待办事项信息包含：

- 基本信息：标题（subject）、发起人（startMemberName）、接收时间（receiveTime）
- 流程信息：流程ID（processId）、摘要ID（summaryId）、节点名称（nodeName）
- 状态信息：状态码（state）、子状态（subState）、子状态名称（subStateName）

### 请求/响应日志（logger）

- 通过 axios 拦截器自动记录完整请求（method/URL/headers/data）和响应（status/headers/data）
- `safeStringify()`：安全序列化对象为 JSON，使用 WeakSet 处理循环引用
- 响应体分类处理：字符串直接输出（超 500 字符截断）、对象用 safeStringify、二进制类型输出类型和大小

### 报表表格查询（SeeyonClient.queryTableResult）

查询报表表格数据，支持【财信】运维工单全量表-效能等任意 designId 指定的报表：

```typescript
import {
  SeeyonClient,
  PERFORMANCE_TABLE_DESIGN_ID,
  PERFORMANCE_TABLE_FIELD,
  getCellValue,
} from './src/lib';

const client = new SeeyonClient({ baseURL: 'http://...' });
await client.login('username', 'password');

// 查询【财信】运维工单全量表-效能，按开发工单号模糊查询
const result = await client.queryTableResult({
  designId: PERFORMANCE_TABLE_DESIGN_ID,
  page: 1,
  size: 50,
  userConditions: [
    {
      fieldName: PERFORMANCE_TABLE_FIELD.DEV_ORDER_NUMBER, // field0140
      fieldValue: 'KFXQ-CX-2026040100180',
      operation: 'Like',
    },
  ],
});

// result.fields 是字段元信息（display/key/dataIndex 等）
// result.data 是数据行，每行以 { [dataIndex]: { v: 值 } } 形式存储
for (const row of result.data) {
  for (const field of result.fields) {
    const value = getCellValue(row, field); // 取出字段值
    console.log(`${field.display}: ${value ?? ''}`);
  }
}
```

API 详情：

- **请求端点**：`POST /ajax.do?method=ajaxAction&managerName=resultAjaxManager`
- **managerMethod**：`queryTableResult`
- **请求参数**：designId（报表ID）、page、size、userConditions（查询条件数组）、customOrderFields（排序）等
- **响应数据**：返回字段元信息列表 fields、数据行 data、分页信息（page/size/pages/total）

常用查询字段（`PERFORMANCE_TABLE_FIELD`）：

| 常量                      | 字段名       | 含义     |
| ------------------------- | ------------ | -------- |
| `SOURCE_ORDER_NUMBER`     | field0125    | 来源工单号 |
| `OPS_ORDER_NUMBER`        | field0139    | 运维工单号 |
| `DEV_ORDER_NUMBER`        | field0140    | 开发工单号 |
| `DEFECT_ORDER_NUMBER`     | field0141    | 缺陷问题单号 |

实现要点：

- 登录状态检查：方法内部检查 sessionId，未登录抛出错误
- 默认值：`size` 默认 50，`needTotal` 默认 true，`viewModel` 默认 view，`aliasTableName` 默认 `formmain_0600_wea`
- 字段取值：数据行以 dataIndex 为键存储 `{ v: 值 }`，使用 `getCellValue(row, field)` 辅助函数安全取值

## 技术栈

| 技术         | 版本      | 用途       |
| ---------- | ------- | -------- |
| TypeScript | ^5.8.3  | 开发语言     |
| axios      | ^1.18.1 | HTTP 请求  |
| crypto-js  | ^4.2.0  | DES 密码加密 |
| tsx        | ^4.20.3 | 运行 TS 脚本 |

编译配置：`target: ES2020`, `module: commonjs`, `strict: true`

## API 接口参考

### SeeyonClientConfig

| 属性      | 类型      | 必填 | 默认值   | 说明                                          |
| ------- | ------- | -- | ----- | ------------------------------------------- |
| baseURL | string  | 是  | -     | 服务器基础地址，如 `http://120.35.0.67:28101/seeyon` |
| timeout | number  | 否  | 30000 | 请求超时时间（毫秒）                                  |
| debug   | boolean | 否  | true  | 是否打印请求/响应日志                                 |

### LoginResult

| 属性        | 类型      | 说明                |
| --------- | ------- | ----------------- |
| success   | boolean | 是否登录成功            |
| message   | string  | 结果消息              |
| sessionId | string  | 登录成功后的 JSESSIONID |

### PendingListParams

查询待办事项列表的参数接口：

| 属性              | 类型               | 必填 | 默认值 | 说明       |
| --------------- | ---------------- | -- | --- | -------- |
| page            | number           | 否  | 1   | 页码，从1开始  |
| size            | number \| string | 否  | 200 | 每页数量     |
| subject         | string           | 否  | -   | 标题（模糊查询） |
| importantLevel  | string           | 否  | -   | 重要程度     |
| createDate      | string           | 否  | -   | 创建日期     |
| templateName    | string           | 否  | -   | 模板名称     |
| startMemberName | string           | 否  | -   | 发起人姓名    |
| preApproverName | string           | 否  | -   | 上一处理人姓名  |
| receiveDate     | string           | 否  | -   | 接收日期     |
| subState        | string           | 否  | -   | 子状态      |
| isOverdue       | string           | 否  | -   | 是否超期     |

### PendingListResult

待办列表查询结果接口：

| 属性        | 类型             | 说明     |
| --------- | -------------- | ------ |
| total     | number         | 总数     |
| pages     | number         | 总页数    |
| data      | PendingItem\[] | 待办列表   |
| size      | number         | 每页数量   |
| showTotal | boolean        | 是否显示总数 |
| page      | number         | 当前页码   |

### PendingItem

单个待办事项接口，包含60+字段，主要字段包括：

- **基本信息**：affairId、subject、startMemberName、startDate、createDate、receiveTime
- **流程信息**：processId、summaryId、caseId、workitemId、templeteId
- **状态信息**：state、subState、subStateName、affairState、readState
- **节点信息**：nodeName、affairNodeName、activityId
- **权限信息**：canForward、canEdit、canReMove、canDeleteORarchive
- **其他信息**：importantLevel、hasAttsFlag、isTrack、hasFavorite等

### QueryTableResultParams

报表表格查询参数接口：

| 属性                | 类型                     | 必填 | 默认值 | 说明                |
| ------------------- | ------------------------ | ---- | ------ | ------------------- |
| designId            | string                   | 是   | -      | 报表设计ID          |
| page                | number                   | 否   | 1      | 页码，从1开始       |
| size                | number                   | 否   | 50     | 每页数量            |
| userConditions      | QueryTableCondition[]    | 否   | []     | 用户查询条件        |
| conditionId         | string                   | 否   | ''     | 条件ID              |
| customOrderFields   | CustomOrderField[]       | 否   | []     | 自定义排序字段      |
| needTotal           | boolean                  | 否   | true   | 是否返回总数        |
| viewModel           | string                   | 否   | 'view' | 视图模式            |
| extParams           | Record<string, unknown>  | 否   | {}     | 扩展参数            |

### QueryTableCondition

报表查询条件接口：

| 属性           | 类型   | 必填 | 默认值              | 说明                          |
| -------------- | ------ | ---- | ------------------- | ----------------------------- |
| fieldName      | string | 是   | -                   | 字段名，如 field0140          |
| fieldValue     | string | 是   | -                   | 字段值                        |
| aliasTableName | string | 否   | formmain_0600_wea   | 别名表名                      |
| operation      | string | 否   | 'Like'              | 操作符                        |
| leftChar       | string | 否   | ''                  | 左侧字符，通常为 "(" 或 ""    |
| rightChar      | string | 否   | ''                  | 右侧字符，通常为 ")" 或 ""    |
| rowOperation   | string | 否   | 'and'               | 行间操作符 "and" / "or"       |

### QueryTableResult

报表查询结果接口：

| 属性          | 类型               | 说明                          |
| ------------- | ------------------ | ----------------------------- |
| success       | boolean            | 是否成功                      |
| msg           | string \| null     | 消息                          |
| fields        | QueryTableField[]  | 字段元信息列表                |
| data          | QueryTableRow[]    | 数据行                        |
| page          | number             | 当前页码                      |
| size          | number             | 每页数量                      |
| pages         | number             | 总页数                        |
| total         | number             | 总数                          |
| penetratable  | boolean            | 是否可穿透（钻取）            |

### QueryTableField

报表字段元信息接口：

| 属性          | 类型             | 说明                                  |
| ------------- | ---------------- | ------------------------------------- |
| display       | string           | 显示名                                |
| key           | string           | 字段键名，如 formmain_0600_wea_field0139 |
| fieldComType  | string \| null   | 字段组件类型（text/member/datetime等）|
| formatType    | string \| null   | 格式类型（yyyy-mm-dd 等）             |
| enableSort    | boolean          | 是否允许排序                          |
| dataIndex     | number           | 数据列索引                            |
| showOrHide    | boolean          | 是否显示                              |
| autoWidth     | boolean          | 是否自动宽度                          |
| width         | number \| null   | 列宽                                  |

### 常量与辅助函数

| 名称                            | 类型     | 说明                                              |
| ------------------------------- | -------- | ------------------------------------------------- |
| `PERFORMANCE_TABLE_DESIGN_ID`   | string   | 【财信】运维工单全量表-效能 报表设计ID            |
| `PERFORMANCE_TABLE_ALIAS`       | string   | 【财信】运维工单全量表-效能 报表表别名            |
| `PERFORMANCE_TABLE_FIELD`       | object   | 常用查询字段名（SOURCE/OPS/DEV/DEFECT_ORDER_NUMBER）|
| `getCellValue(row, field)`      | function | 从数据行中提取指定字段的值                        |

### 导出

```typescript
export { SeeyonClient } from './seeyon-client';
export {
  PERFORMANCE_TABLE_DESIGN_ID,
  PERFORMANCE_TABLE_ALIAS,
  PERFORMANCE_TABLE_FIELD,
  getCellValue,
} from './seeyon-client';
export type {
  SeeyonClientConfig,
  LoginResult,
  PendingListParams,
  PendingItem,
  PendingListResult,
  QueryTableCondition,
  CustomOrderField,
  QueryTableResultParams,
  QueryTableField,
  QueryTableRow,
  QueryTableResult,
} from './seeyon-client';
export { safeStringify } from './logger';
```

## 文档

- **开发计划文档**：`.trae/documents/` — 功能实施计划和架构决策，当项目需求变更时，需要更新该文档
- **页面分析文档**：`.trae\docs` — 功能模块分析文档，`.trae\docs\index.md`是索引，按需读取对应文档，，当项目需求变更时，需要更新`.trae\docs\index.md`和对应文档

