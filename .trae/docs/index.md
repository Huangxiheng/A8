# Seeyon A8+ 系统文档索引

## 文档结构

本目录包含 Seeyon A8+ 系统的页面分析和接口文档，按功能模块组织。这些文档是客户端库开发的基础，记录了各模块的页面结构、DOM 元素、JS 函数逻辑、API 端点和安全机制。

## 模块列表

### 1. 登录模块 (login) — ✅ 已实现
- [登录页面分析](login/Login_Page_Analysis.md)
- [登录页面HTML源码](login/Login_Page.do) — 包含完整 JS 逻辑，是登录实现的核心参考
- [登录页面截图](login/login_page_screenshot.png)

**已实现接口：**
| API端点 | HTTP方法 | 实现状态 | 对应方法 |
|---------|----------|----------|----------|
| `/main.do?method=updateLoginSeed` | GET | ✅ 已实现 | `SeeyonClient.updateSecuritySeed()` |
| `/main.do?method=login` | POST | ✅ 已实现 | `SeeyonClient.login()` |

**实现要点：**
- 加密种子与 Session 绑定：必须先调用 updateLoginSeed 获取种子和 JSESSIONID，再携带同一 JSESSIONID 发送登录请求
- 密码加密：`CryptoJS.DES.encrypt(CryptoJS.enc.Utf8.parse(password), seed)`
- 登录成功判断：响应体以 "ok" 开头 或 响应头 `loginok: ok`（302 重定向场景）
- Cookie 管理：手动从 Set-Cookie 提取 JSESSIONID，不使用 CookieJar

### 2. 主页面模块 (main) — 🔲 待实现
- [主页面分析](main/Main_Page_Analysis.md)
- [主页面截图](main/main_page_screenshot.png)

**待实现接口：**
| API端点 | HTTP方法 | 功能 |
|---------|----------|------|
| `/main.do?method=main` | GET | 获取主页面数据 |

### 3. 待办模块 (todo) — 🔄 部分实现
- [待办列表页分析](todo/Todo_List_Page_Analysis.md)
- [待办详情页分析](todo/Todo_Detail_Page_Analysis.md)
- [待办详情页截图](todo/todo_detail_screenshot.png)

**已实现接口：**
| API端点 | HTTP方法 | 实现状态 | 对应方法 |
|---------|----------|----------|----------|
| `/ajax.do?method=ajaxAction&managerName=colManager` | POST | ✅ 已实现 | `SeeyonClient.getPendingList()` |
| `/collaboration/collaboration.do?method=summary` | GET | ✅ 已实现 | `SeeyonClient.getTodoDetail()` |

**待实现接口：**
| API端点 | HTTP方法 | 功能 |
|---------|----------|------|
| `/collaboration/collaboration.do?method=deal` | POST | 提交审批意见 |

**实现要点：**
- 待办列表查询：通过 AJAX 调用 `colManager` 的 `getPendingList` 方法，支持分页和多种查询条件
- 查询参数：支持 subject（标题）、importantLevel（重要程度）、createDate（创建日期）等多种过滤条件
- 响应数据：返回待办事项列表，包含 affairId、subject、startMemberName、receiveTime 等60+字段
- 待办详情查询：调用 `collaboration.do?method=summary`，传入 affairId（来自待办列表）和固定 portalId（`DEFAULT_PORTAL_ID = -7281551384037538933`）
- 待办详情响应：服务器返回 JSP 渲染后的 HTML，关键数据以 `var xxx = 'value';` 嵌入 `<script>` 块，封装方法用正则提取 rightId、zwIframeModuleId、templateId、templateProcessId、_contextProcessId、_summaryProcessId 等变量，原始 HTML 保留在 rawHtml 字段

### 4. 流程模块 (process) — 🔲 待实现
- [流程页面分析](process/Process_Page_Analysis.md)
- [流程页面截图](process/process_page_screenshot.png)

**待实现接口：**
| API端点 | HTTP方法 | 功能 |
|---------|----------|------|
| `/workflowPrediction.do?method=prediction` | GET/POST | 流程预测 |

### 5. 报表模块 (report) — 🔄 部分实现
- [报表分析页文档](report/Report_Analysis_Page_Analysis.md)
- [报表分析页截图](report/report_analysis_page.png)
- [查询报表结果分析](queryTableResult/Query_Table_Result_Analysis.md)

**已实现接口：**
| API端点 | HTTP方法 | 实现状态 | 对应方法 |
|---------|----------|----------|----------|
| `/ajax.do?method=ajaxAction&managerName=resultAjaxManager` | POST | ✅ 已实现 | `SeeyonClient.queryTableResult()` |

**待实现接口：**
| API端点 | HTTP方法 | 功能 |
|---------|----------|------|
| `/vreport/vReport.do?method=vReportView` | GET | 报表视图 |

**实现要点：**
- 报表表格查询：通过 AJAX 调用 `resultAjaxManager` 的 `queryTableResult` 方法，按 designId 查询指定报表数据
- 查询参数：designId（报表ID）、page、size、userConditions（查询条件数组，支持 leftChar/aliasTableName/fieldName/operation/fieldValue/rightChar/rowOperation）
- 内置常量：`PERFORMANCE_TABLE_DESIGN_ID`（【财信】运维工单全量表-效能 报表ID）、`PERFORMANCE_TABLE_FIELD`（常用字段名）
- 响应数据：返回字段元信息 fields 和数据行 data，数据行以 `{ [dataIndex]: { v: 值 } }` 形式存储，可用 `getCellValue(row, field)` 取值

## 使用说明

各模块文档包含：
- 页面结构分析
- DOM元素清单
- JavaScript函数分析
- API接口列表
- 安全机制说明
- 流程图和截图

这些文档通过浏览器抓取 Seeyon A8+ 系统的实际页面生成，是 API 客户端开发的原始资料。