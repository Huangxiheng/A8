# Seeyon A8+ 待办详情流程页面分析文档

## 1. 页面概述

### 1.1 页面基本信息

| 属性 | 值 |
|------|------|
| **页面标题** | --开发需求-KFXQ-CX-2026070200173-新版报销内部测试项目 |
| **URL模式** | `/seeyon/workflow/designer.do?method=showDiagram&...` |
| **所属模块** | 协同审批 - 待办详情 |
| **当前流程ID** | `6187292868810196682` |
| **当前CaseID** | `-4395844875674235400` |
| **当前节点ID** | `17086789445303` |
| **当前节点名称** | 研发负责人处理 |

### 1.2 页面截图

![流程页面截图](file:///C:/IDEA/project/A8/process_page_screenshot.png)

---

## 2. 页面整体布局

### 2.1 布局架构

流程页面采用 **iframe嵌套架构**，流程设计器通过独立的iframe加载：

```
┌─────────────────────────────────────────────────────────────────┐
│                      主页面 (summaryDetail)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    流程助手工具栏                            │ │
│  │  流程助手 | 查看流程说明书 | 相关数据 | 流程预测 | 智能校验  │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Tab页切换区域                            │ │
│  │        [表单]                    [流程]                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                 iframeright (流程设计器iframe)              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │              流程画布区域 (BPMN图形渲染)                │  │ │
│  │  │                                                      │  │ │
│  │  │   [开始节点] ──► [发起者验证] ──► [研发负责人] ──►...  │  │ │
│  │  │                                                      │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │              流程操作工具栏                            │  │ │
│  │  │  放大 | 缩小 | 导出 | 导入 | 克隆模板 | 展开/收起      │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   右侧处理意见区                            │ │
│  │  操作工具栏 | 意见输入 | 附件 | 提交/暂存按钮              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 核心DOM结构

| DOM元素 | ID | 用途 |
|---------|-----|------|
| 流程设计器iframe | `iframeright` | 承载流程设计器主界面 |
| 流程高级搜索框 | `processAdvanceDIV` | 流程节点搜索功能 |
| 搜索输入框 | `searchText` | 输入处理人姓名搜索 |
| Tab页容器 | `common_tabs` | 表单/流程Tab切换 |

---

## 3. 流程数据来源分析

### 3.1 流程设计器入口URL

流程页面通过以下URL加载：

```
/seeyon/workflow/designer.do?method=showDiagram
    &isDebugger=false
    &isModalDialog=true
    &isTemplate=true
    &formApp=
    &appName=collaboration
    &san=
    &processId=6187292868810196682
    &currentUserId=
    &currentUserName=
    &currentUserAccountName=undefined
    &defaultPolicyId=
    &defaultPolicyName=
    &flowPermAccountId=
    &wendanId=-1
    &isvalidate=false
    &oldPTId=
    &startFormViewOperation=undefined
    &nodeFormViewOperation=undefined
    &needValidate=undefined
    &canCopyFlow=undefined
    &isHistoryFlag=false
    &caseId=-4395844875674235400
    &currentNodeId=17086789445303
    &formMutilOprationIds=
    &showHastenButton=false
    &superviseId=
    &selectPeopleExtParams=
    &SPK=freeFlow
    &NPS=default
    &masterId=
    &canExePrediction=true
    &needClonedProcessId=
    &CWID=undefined
    &SD=undefined
    &isSkipNode=false
    &canSetCircleBranch=true
    &v=42e1b8e4aef2bb12f99559ef72395f83
    &isCIPModel=false
    &onlyEditSubProcess=false
    &disableEditSubprocess=false
    &action=1
    &openFromIframe=true
    &scene=3
```

### 3.2 URL参数详解

| 参数名 | 值 | 说明 |
|--------|------|------|
| `method` | `showDiagram` | 方法名，显示流程图 |
| `processId` | `6187292868810196682` | 流程模板ID |
| `caseId` | `-4395844875674235400` | 流程实例ID |
| `currentNodeId` | `17086789445303` | 当前节点ID |
| `appName` | `collaboration` | 应用名称，协同审批 |
| `isTemplate` | `true` | 是否为模板模式 |
| `isHistoryFlag` | `false` | 是否历史流程 |
| `canExePrediction` | `true` | 是否允许执行流程预测 |
| `action` | `1` | 操作类型，查看模式 |
| `scene` | `3` | 场景标识 |
| `SPK` | `freeFlow` | 流程策略Key |
| `NPS` | `default` | 节点策略Key |
| `v` | `42e1b8e4aef2bb12f99559ef72395f83` | 版本号/缓存标识 |

### 3.3 流程XML数据结构

流程数据通过 `initialize_processXml` 变量传递，采用自定义XML格式：

```xml
<ps>
  <p t="p" s="false" i="6187292868810196682" n="" d="" w="true" u="">
    <!-- 开始节点 -->
    <n i="start" n="李慧杰" t="8" d="" x="0" y="2" b="normal">
      <a k="roleadmin" c="1" g="user" d="李慧杰"/>
      <s i="newCol" n="新建" t="17" l="0" s="success"/>
    </n>
    <!-- 发起者验证节点 -->
    <n i="17064392969494" n="发起者" t="6" ncn="发起者验证" x="15" y="0.5">
      <a k="roleadmin" g="Node" d="发起者(正式系统测试部)"/>
      <s i="审批-财信" n="审批-财信" t="17" l="2880" s="success"/>
    </n>
    <!-- 研发负责人处理节点 -->
    <n i="17086789445303" n="研发负责人" t="6" ncn="研发负责人处理" x="1" y="2">
      <a k="roleadmin" g="FormField" d="研发负责人" 
         f="Multimember@field0117#研发负责人"/>
      <s i="审批-财信" n="审批-财信" t="17" l="0" j="competition"/>
    </n>
    <!-- 需求负责人处理节点 -->
    <n i="17086789705305" n="需求负责人" t="6" ncn="需求负责人处理" x="3" y="1.5">
      <a k="roleadmin" g="FormField" d="需求负责人"
         f="Multimember@field0115#需求负责人"/>
      <s i="审批-财信" n="审批-财信" t="17" l="0" j="competition"/>
    </n>
    <!-- 结束节点 -->
    <n i="end" n="end" t="4" x="22" y="2"/>
  </p>
</ps>
```

### 3.4 XML标签说明

| 标签 | 属性 | 说明 |
|------|------|------|
| `<ps>` | - | 流程定义根节点 |
| `<p>` | `i`: processId, `w`: 是否可写 | 流程模板 |
| `<n>` | `i`: nodeId, `n`: 节点名称, `t`: 节点类型, `ncn`: 节点中文名, `b`: 状态 | 流程节点 |
| `<a>` | `k`: 权限类型, `g`: 参与者类型(user/Node/FormField), `d`: 显示名称, `f`: 字段引用 | 参与者配置 |
| `<s>` | `i`: 连线ID, `n`: 连线名称, `l`: 耗时(秒), `s`: 状态(success/pending), `j`: 分支类型(single/competition) | 连线(流转) |

### 3.5 节点类型对照表

| 类型值 | 含义 | 对应类 |
|--------|------|--------|
| `4` | 结束节点 | BPMEnd |
| `6` | 人工活动节点 | BPMHumenActivity |
| `8` | 开始节点 | BPMStart |
| `17` | 流转连线 | BPMTransition |

---

## 4. 后端API端点分析

### 4.1 流程设计器主接口

**接口地址**: `/seeyon/workflow/designer.do`

**支持方法**:

| method参数 | 功能 |
|------------|------|
| `showDiagram` | 显示流程图（当前使用） |
| `saveDiagram` | 保存流程图 |
| `validateDiagram` | 验证流程图 |
| `cloneTemplate` | 克隆流程模板 |
| `exportDiagram` | 导出流程图 |

### 4.2 全局环境接口

**接口地址**: `/seeyon/rest/global/v1/env`

**功能**: 返回全局环境变量配置

### 4.3 流程追踪相关接口

根据页面JavaScript分析，流程追踪相关的后端接口包括：

| 接口路径 | 功能 |
|----------|------|
| `/seeyon/workflow/trace.do` | 流程追踪 |
| `/seeyon/workflow/log.do` | 流程日志 |
| `/seeyon/workflow/prediction.do` | 流程预测 |

### 4.4 流程操作接口

| 接口路径 | 功能 |
|----------|------|
| `/seeyon/workflow/action.do` | 流程操作（提交、回退、移交等） |
| `/seeyon/workflow/designer.do?method=updateProcessAjaxDB` | 更新流程到数据库 |
| `/seeyon/workflow/designer.do?method=executeValidateWorkflowXML` | 验证流程XML |

---

## 5. 关键JavaScript函数分析

### 5.1 主页面流程函数

#### `showWorkFlowView()`

```javascript
function showWorkFlowView(){
    $("#content_view_li").removeClass("current");
    $("#query_view_li").removeClass("current");
    $("#statics_view_li").removeClass("current");
    $("#workflow_view_li").addClass("current");
    $("#queryDiv").hide();
    $("#iframeright").show();
    if((isSupervise||isCurSuperivse)&&!isFinish&&affairState!="1"){
        if(isHistoryFlag!="true"){
            $("#show_edit_workFlow").show()
        }
        summaryHeadHeight()
    }
    $("#iframeright").css("display","block")
}
```

**功能**: 切换到流程视图Tab，显示流程设计器iframe

### 5.2 WorkflowApi模块

```javascript
WorkflowApi = {
    cacheWorkflowData: function(){...},
    fallbackWorkflowCacheData: function(){...},
    getEditSubProcessInfos: function(){...},
    transObj2Url: function(){...}
}
```

**功能**: 流程数据缓存和子流程信息获取

### 5.3 流程高级搜索

#### `enterKeySearch(event)`

**功能**: 搜索框回车触发搜索

#### `doSearch(direction)`

**功能**: 按方向(forward/back)搜索流程节点

#### `advanceViews(show)`

**功能**: 显示/隐藏高级搜索面板

---

## 6. 流程设计器核心模块 (iframe内部)

### 6.1 WorkflowApp 架构

```javascript
WorkflowApp = {
    AutoLayout: ...,      // 自动布局算法
    Controller: ...,      // 控制器
    Model: ...,           // 数据模型
    View: ...,            // 视图渲染
    MenuManager: ...,     // 菜单管理
    BPMObject: ...,       // BPM对象基类
    BPMProcess: ...,      // 流程对象
    BPMAbstractNode: ..., // 节点抽象类
    BPMTransition: ...,   // 连线对象
    BPMHumenActivity: ...,// 人工活动节点
    BPMStart: ...,        // 开始节点
    BPMEnd: ...,          // 结束节点
    // ... 其他组件
}
```

### 6.2 核心管理器

| 管理器名称 | 功能 |
|------------|------|
| `workflowManageManager` | 流程管理主控制器 |
| `traceWorkflowManager` | 流程追踪管理 |
| `workflowPredictionManager` | 流程预测管理 |
| `processLogManager` | 流程日志管理 |
| `cipWorkFlowManager` | CIP流程管理 |
| `flowEventComponentManager` | 流程事件组件管理 |

### 6.3 关键变量

| 变量名 | 值 | 说明 |
|--------|------|------|
| `currentProcesssId` | `6187292868810196682` | 当前流程模板ID |
| `processId` | `6187292868810196682` | 流程ID |
| `isHistoryFlag` | `"false"` | 是否历史流程 |
| `currentUserId` | `9107420564351240468` | 当前用户ID |
| `processState` | `0` | 流程状态 |
| `isTemplate` | `"true"` | 是否模板模式 |
| `scene` | `"3"` | 场景标识 |
| `subProcessJson` | `{}` | 子流程数据 |
| `processProperties` | `"{\"nodesAttr\":{...}}"` | 流程属性配置 |

---

## 7. 流程画布渲染机制

### 7.1 渲染流程

```
1. 页面加载 → 解析URL参数
2. 请求流程XML数据 → initialize_processXml
3. WorkflowApp.Model 解析XML → 构建BPM对象树
4. WorkflowApp.AutoLayout 计算节点位置
5. WorkflowApp.View 渲染SVG/Canvas图形
6. WorkflowApp.Controller 绑定交互事件
```

### 7.2 核心渲染组件

| 组件 | 职责 |
|------|------|
| `AutoLayout` | 自动计算节点布局位置 |
| `Model` | 管理流程数据模型 |
| `View` | 负责图形渲染 |
| `Controller` | 处理用户交互 |

---

## 8. 技术栈分析

| 类别 | 技术/框架 | 文件路径 |
|------|-----------|----------|
| **流程设计器核心** | ocipWorkflowDesigner | `/seeyon/extend/js/ctp/workflow/workflowDesigner/ocipWorkflowDesigner.js` |
| **AJAX操作** | workflowDesigner_ajax | `/seeyon/common/workflow/workflowDesigner_ajax.js` |
| **XML解码** | workflowDesigner_decode | `/seeyon/common/workflow/workflowDesigner_decode.js` |
| **UI组件库** | ctpUi | `/seeyon/common/ctpUi/dist/js/ctpUi.min.js` |
| **动态表单** | cap-dynamic-front | `/seeyon/common/cap-dynamic-front/load.js` |
| **图标字体** | syIconfont | 内嵌样式 |
| **jQuery** | jQuery 1.x | `/seeyon/common/all-min.js` |

---

## 9. 流程节点详情

### 9.1 当前流程节点列表

| 节点ID | 节点名称 | 节点中文名 | 类型 | 位置(x,y) | 状态 |
|--------|----------|------------|------|-----------|------|
| `start` | 李慧杰 | - | 开始节点 | (0, 2) | completed |
| `17064392969494` | 发起者 | 发起者验证 | 人工活动 | (15, 0.5) | completed |
| `17086789445303` | 研发负责人 | 研发负责人处理 | 人工活动 | (1, 2) | **current** |
| `17086789705305` | 需求负责人 | 需求负责人处理 | 人工活动 | (3, 1.5) | pending |
| `17086789795407` | 研发负责人 | 研发负责人处理—确定修改 | 人工活动 | (5, 1) | pending |
| `end` | end | - | 结束节点 | (22, 2) | pending |

### 9.2 当前节点参与者配置

**节点**: 研发负责人处理 (`17086789445303`)

| 属性 | 值 |
|------|------|
| 参与者类型 | `FormField` (表单字段) |
| 字段引用 | `Multimember@field0117#研发负责人` |
| 分支类型 | `competition` (竞争模式) |
| 处理人列表 | 黄习恒、李慧杰等多人 |

---

## 10. 页面架构与加载机制

### 10.1 加载时序

```
1. 主页面加载 summaryDetail-min.js
2. 用户点击"流程"Tab → showWorkFlowView()
3. 创建iframeright iframe，加载流程设计器URL
4. 流程设计器页面加载：
   - 加载全局环境变量 (/seeyon/rest/global/v1/env)
   - 加载 ocipWorkflowDesigner.js
   - 加载 workflowDesigner_ajax.js
   - 加载 workflowDesigner_decode.js
5. 解析 initialize_processXml 变量
6. 构建流程对象模型
7. 渲染流程画布
```

### 10.2 数据传递方式

流程数据通过 **页面内嵌JavaScript变量** 传递，而非AJAX请求：

```html
<script type="text/javascript">
var initialize_processXml = '<ps><p t="p" ...>...</p></ps>';
var currentProcesssId = '6187292868810196682';
var isHistoryFlag = "false";
// ... 其他变量
</script>
```

---

## 11. 关联文档

| 文档名称 | 路径 |
|----------|------|
| 登录页面分析 | [Seeyon_A8_Login_Page_Analysis.md](file:///C:/IDEA/project/A8/Seeyon_A8_Login_Page_Analysis.md) |
| 主应用页面分析 | [Seeyon_A8_Main_Page_Analysis.md](file:///C:/IDEA/project/A8/Seeyon_A8_Main_Page_Analysis.md) |
| 待办详情页面分析 | [Seeyon_A8_Todo_Detail_Page_Analysis.md](file:///C:/IDEA/project/A8/Seeyon_A8_Todo_Detail_Page_Analysis.md) |

---

## 12. 总结

流程页面是Seeyon A8+ OA系统中**核心的流程可视化组件**，具有以下特点：

1. **iframe隔离架构**: 流程设计器通过独立iframe加载，实现模块化和隔离
2. **XML数据格式**: 流程定义采用自定义XML格式，包含节点、参与者、连线等完整信息
3. **BPM对象模型**: 基于WorkflowApp框架构建BPM对象树，支持多种节点类型
4. **实时渲染**: 支持流程图的放大、缩小、导出、克隆等操作
5. **流程预测**: 集成流程预测功能，支持大数据预测后续节点和耗时
6. **场景化设计**: 通过scene参数区分不同使用场景（查看/编辑/追踪等）

流程数据来源主要通过 **URL参数** 和 **页面内嵌JavaScript变量** 传递，后端接口 `/seeyon/workflow/designer.do` 负责流程设计器的核心功能。