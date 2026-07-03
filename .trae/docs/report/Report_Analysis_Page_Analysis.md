# Seeyon A8+ 报表分析页面分析文档

## 1. 页面概述

### 1.1 页面基本信息

| 属性 | 值 |
|------|------|
| **页面标题** | 报表分析 |
| **URL模式** | `/seeyon/vreport/vReport.do?method=vReportView&portalId=<id>&_resourceCode=F08_report_view` |
| **所属模块** | 报表中心 - 报表分析 |
| **当前portalId** | `-7281551384037538933` |
| **资源编码** | `F08_report_view` |

### 1.2 页面截图

![报表分析页面截图](file:///C:/IDEA/project/A8/report_analysis_page.png)

---

## 2. 页面整体布局

### 2.1 布局架构

报表分析页面采用 **左侧菜单 + 右侧内容** 的经典布局模式：

```
┌─────────────────────────────────────────────────────────────────┐
│                      报表分析页面                                │
│  ┌────────────────────────┐  ┌───────────────────────────────┐ │
│  │       左侧菜单栏        │  │           右侧内容区           │ │
│  │  ┌──────────────────┐  │  │                               │ │
│  │  │ 报表中心logo/标题 │  │  │   搜索框：输入报表名称         │ │
│  │  └──────────────────┘  │  │                               │ │
│  │  ┌──────────────────┐  │  │   功能按钮：报表示例           │ │
│  │  │ 集团公共管理报表  │  │  │                               │ │
│  │  │ 项目管理         │  │  │   报表列表区域                 │ │
│  │  │ 工时管理         │  │  │                               │ │
│  │  │ 研发管理         │  │  │   报表预览/查看区域            │ │
│  │  │ 运维管理         │  │  │                               │ │
│  │  │ 项目报表         │  │  │                               │ │
│  │  │ 财信管理报表     │  │  │                               │ │
│  │  └──────────────────┘  │  └───────────────────────────────┘ │
│  └────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 核心DOM结构

| DOM元素 | 类名/ID | 用途 |
|---------|---------|------|
| 左侧布局容器 | `.left-layout` | 承载左侧菜单区域 |
| 左侧图标区域 | `.left-layout-icon` | 显示报表中心logo和标题 |
| 左侧菜单列表 | `.left-layout-list` | 报表分类菜单容器 |
| 菜单块 | `.menu-block` | 报表分类容器 |
| 分类菜单 | `.c-menu.pmenu_0` | 一级分类菜单（category="true"） |
| 报表节点 | `.report-node` | 具体报表项（category="false"） |
| 搜索框 | `[placeholder="输入报表名称"]` | 报表名称搜索 |
| 报表示例 | `[text="报表示例"]` | 报表示例链接 |

---

## 3. 报表分类体系

### 3.1 报表分类列表

| 分类名称 | 分类ID | 展开状态 | 图标类名 |
|----------|--------|----------|----------|
| 集团公共管理报表 | `-5613011561401137002` | 未展开 | `vp-yishouqiwenjianjia` |
| 项目管理 | `2606352244496222026` | 未展开 | `vp-yishouqiwenjianjia` |
| 工时管理 | 动态生成 | 未展开 | `vp-yishouqiwenjianjia` |
| 研发管理 | 动态生成 | 未展开 | `vp-yishouqiwenjianjia` |
| 运维管理 | 动态生成 | 未展开 | `vp-yishouqiwenjianjia` |
| 项目报表 | 动态生成 | 未展开 | `vp-yishouqiwenjianjia` |
| 财信管理报表 | 动态生成 | 未展开 | `vp-yishouqiwenjianjia` |

### 3.2 项目管理分类下的报表

| 报表ID | 报表名称 | 所属组织 |
|--------|----------|----------|
| `-6736886960812044692` | 【WBS】交付文档上传情况 | 博思集团 |
| `4251724460940739400` | 项目风险统计-负责项目及负责风险 | 博思集团 |
| `-1979522612346862094` | 项目问题统计-负责项目及负责问题 | 博思集团 |
| `8049254656232472924` | 【个人】历史个人周报查询 | 博思集团 |
| `-5759666877764320728` | 【个人】历史个人日报查询 | 博思集团 |
| `-18374866630195820` | 查询公有角色 | 博思集团 |
| `-3142592947519797885` | 在建项目成本投入-负责项目 | 博思集团 |
| `-1230296552377267923` | 现存问题-负责的问题 | 博思集团 |
| `890888103453608920` | 未审批任务统计-我负责 | 博思集团 |
| `1559467265450068134` | 项目类型状态统计-负责项目 | 博思集团 |
| `1565932813165347856` | 项目风险统计-负责项目 | 博思集团 |

### 3.3 菜单节点属性说明

每个菜单节点包含以下核心属性：

| 属性 | 说明 | 示例值 |
|------|------|--------|
| `id` | 节点唯一标识 | `-5613011561401137002` |
| `parentid` | 父节点ID | `0`（顶级）或分类ID |
| `categoryid` | 分类ID（仅分类节点） | `-5613011561401137002` |
| `reportid` | 报表ID（仅报表节点） | `-6736886960812044692` |
| `category` | 是否为分类节点 | `true`/`false` |
| `opend` | 是否展开 | `true`/`false` |
| `title` | 报表完整标题（含组织） | 【WBS】交付文档上传情况(博思集团) |

---

## 4. 后端API端点分析

### 4.1 报表查看主接口

**接口地址**: `/seeyon/vreport/vReport.do`

**支持方法**:

| method参数 | 功能 |
|------------|------|
| `vReportView` | 报表查看首页（当前使用） |
| `showReport` | 展示单个报表 |

**URL参数详解**:

| 参数名 | 值 | 说明 |
|--------|------|------|
| `method` | `vReportView` | 方法名，查看报表 |
| `portalId` | `-7281551384037538933` | 门户ID |
| `_resourceCode` | `F08_report_view` | 资源编码 |

### 4.2 报表数据获取接口

#### 4.2.1 报表展示接口

**接口地址**: `/seeyon/vreport/vReport.do`

**method参数**: `showReport`

**URL参数**:

| 参数名 | 值 | 说明 |
|--------|------|------|
| `method` | `showReport` | 方法名，展示报表 |
| `id` | `<reportId>` | 报表ID |
| `module` | `2` | 模块标识 |
| `type` | `2` | 类型标识 |

**调用时机**: 用户点击左侧菜单中的报表项时触发

**响应**: 返回报表展示页面（HTML格式），大小约400字节

#### 4.2.2 报表结果接口

**接口地址**: `/seeyon/report4Result.do`

**method参数**: `showResult`

**URL参数**:

| 参数名 | 值 | 说明 |
|--------|------|------|
| `method` | `showResult` | 方法名，展示报表结果 |
| `designId` | `<reportId>` | 报表设计ID（与报表ID相同） |

**调用时机**: 在`showReport`接口之后，由页面内部自动发起

**响应**: 返回报表结果页面（HTML格式），包含报表数据和渲染所需的资源

### 4.3 报表项数据来源

报表数据来源分为两个阶段：

#### 阶段一：页面初始加载

报表分类和报表列表通过**服务器端渲染**直接输出到HTML中：

```html
<div class="menu-block" id="reportView">
    <div parentid="0" id="-5613011561401137002" categoryid="-5613011561401137002" 
         category="true" opend="false" class="c-menu pmenu_0">
        <i class="vp-yishouqiwenjianjia package-icon"></i>
        <span>集团公共管理报表</span>
    </div>
    <div parentid="-5613011561401137002" id="-6736886960812044692" 
         reportid="-6736886960812044692" category="false" 
         class="c-menu pmenu_-5613011561401137002 report-node">
        <span class="vp-shoucang collect-icon" title="关注"></span>
        <span>【WBS】交付文档上传情况(博思集团)</span>
    </div>
</div>
```

**数据源**: 后端数据库中的报表分类表和报表定义表

#### 阶段二：点击报表项

用户点击报表项后，系统通过以下流程获取报表数据：

```
1. 点击报表节点 → 触发前端点击事件
2. 前端提取报表ID (reportid属性)
3. 请求 vReport.do?method=showReport&id=<reportId>&module=2&type=2
4. 服务器返回报表展示页面HTML
5. 页面内部自动请求 report4Result.do?method=showResult&designId=<reportId>
6. 服务器返回报表结果页面HTML和数据
7. 加载相关CSS/JS资源（ctpUi、all-min.js等）
8. 在右侧iframe中渲染报表内容
```

**数据源**: 后端数据库中的报表模板定义、报表数据集配置、以及关联的业务数据（项目、风险、问题等）

### 4.4 报表相关API模块

根据页面JavaScript分析，报表系统包含以下核心API模块：

| 模块名称 | 功能 |
|----------|------|
| `reportSpaceAjax` | 报表空间AJAX操作 |
| `seeyonReportAdminManager` | 报表管理后台管理 |
| `vReportFilterManager` | 报表过滤器管理 |
| `vReportQuotaAjaxManager` | 报表配额AJAX管理 |
| `seeyonReportManager` | 报表主管理模块 |
| `seeyonReportDataSetManager` | 报表数据集管理 |
| `reportApi` | 报表API接口 |
| `seeyonReportTemplateManager` | 报表模板管理 |
| `excelReportAjaxManager` | Excel报表AJAX操作 |

---

## 5. 报表项点击行为分析

### 5.1 点击报表项的完整流程

当用户点击任意报表项时，系统会执行以下步骤：

```
1. 点击事件触发
   └── 用户点击左侧菜单中的报表节点（带有reportid属性的div）

2. 前端处理
   └── vreportView模块的事件处理函数捕获点击
   └── 提取报表节点的reportid属性值
   └── 构建报表展示URL

3. URL构建
   └── /seeyon/vreport/vReport.do?method=showReport&id=<reportId>&module=2&type=2

4. 发起HTTP请求（GET）
   └── 请求 showReport 接口
   └── 服务器返回报表展示页面HTML

5. 页面内部重定向
   └── 自动发起 /seeyon/report4Result.do?method=showResult&designId=<reportId>
   └── 服务器返回报表结果页面

6. 资源加载
   └── 加载全局环境变量 (/seeyon/rest/global/v1/env)
   └── 加载CSS资源（all-min.css, skinComponents-defaultTheme-min.css, ctpUi.css等）
   └── 加载JS资源（all-min.js, ctpUi.min.js, headerjs等）

7. 渲染展示
   └── 在右侧内容区的iframe中渲染报表内容
   └── 报表数据根据模板定义和数据集配置动态展示
```

### 5.2 点击行为的网络请求序列

根据HAR分析，点击报表项"项目风险统计-负责项目及负责风险"后触发的网络请求：

| 序号 | 请求URL | 方法 | 参数 | 响应大小 | 说明 |
|------|---------|------|------|----------|------|
| 1 | `/seeyon/vreport/vReport.do` | GET | `method=showReport&id=4251724460940739400&module=2&type=2` | 400B | 报表展示接口 |
| 2 | `/seeyon/report4Result.do` | GET | `method=showResult&designId=4251724460940739400` | 2004B | 报表结果接口 |
| 3 | `/seeyon/rest/global/v1/env` | GET | - | 2283B | 全局环境变量 |
| 4 | `/seeyon/common/all-min.css` | GET | `V=V8_1SP2_230116_17050914` | 缓存 | 全局样式 |
| 5 | `/seeyon/skin/dist/min/skinComponents-defaultTheme-min.css` | GET | `V=V8_1SP2_230116_17050914` | 缓存 | 皮肤组件样式 |
| 6 | `/seeyon/common/ctpUi/dist/css/ctpUi.css` | GET | `V=V8_1SP2_230116_17050914` | 缓存 | UI组件样式 |
| 7 | `/seeyon/common/all-min.js` | GET | `V=V8_1SP2_230116_17050914` | 缓存 | 全局脚本 |
| 8 | `/seeyon/common/ctpUi/dist/js/ctpUi.min.js` | GET | `V=V8_1SP2_230116_17050914` | 缓存 | UI组件脚本 |

### 5.3 所有报表项点击后的通用行为

无论点击哪个报表项，都会触发以下通用行为：

#### 5.3.1 相同的流程
- **URL模式**: `/seeyon/vreport/vReport.do?method=showReport&id=<报表ID>&module=2&type=2`
- **重定向模式**: `/seeyon/report4Result.do?method=showResult&designId=<报表ID>`
- **渲染方式**: 在右侧iframe中展示报表内容
- **资源加载**: 加载相同的CSS/JS资源文件

#### 5.3.2 不同的内容
- **报表数据**: 每个报表展示的数据根据其数据集配置不同
- **报表格式**: 报表的布局和样式根据其模板定义不同
- **数据源**: 报表数据来源于不同的业务表（项目、风险、问题、工时等）

#### 5.3.3 报表类型与数据源映射

| 报表分类 | 报表名称 | 数据源 |
|----------|----------|--------|
| 集团公共管理报表 | 【WBS】交付文档上传情况 | 项目交付文档表 |
| 项目管理 | 项目风险统计-负责项目及负责风险 | 项目表 + 风险表 |
| 项目管理 | 项目问题统计-负责项目及负责问题 | 项目表 + 问题表 |
| 项目管理 | 【个人】历史个人周报查询 | 周报记录表 |
| 项目管理 | 【个人】历史个人日报查询 | 日报记录表 |
| 项目管理 | 查询公有角色 | 角色表 |
| 项目管理 | 在建项目成本投入-负责项目 | 项目表 + 成本表 |
| 项目管理 | 现存问题-负责的问题 | 问题表 |
| 项目管理 | 未审批任务统计-我负责 | 任务表 |
| 项目管理 | 项目类型状态统计-负责项目 | 项目表 |
| 项目管理 | 任务状态统计-负责项目 | 项目表 + 任务表 |
| 项目管理 | 费用支出查询 | 费用表 |
| 工时管理 | 相关报表 | 工时表 |
| 研发管理 | 相关报表 | 研发数据表 |
| 运维管理 | 相关报表 | 运维数据表 |
| 财信管理报表 | 相关报表 | 财务数据表 |

### 5.4 关键JavaScript函数分析

#### 5.4.1 vreportView模块

```javascript
vreportView = {
    initReportViewData: function(callback) {
        currentMode = "vreportView";
        setTimeout(function () {
            _init_event_();
        }, 0);
        _init_viewdata_(true, function () {
            _initCountData_();
            _init_left_(tabDataMap["all"].getCategoryTree());
            _init_right_(tabDataMap["all"].getCategoryList());
            callback();
        });
    },
    initReportHome: function(callback) {
        _init_event_();
        currentMode = "vreportHome";
        callback();
    },
    openNewBiinsidePageDesign: function() {
        // 打开新的报表设计页面
    }
}
```

**功能**: 
- `initReportViewData`: 初始化报表查看页面数据，包括左侧分类树和右侧报表列表
- `initReportHome`: 初始化报表首页
- `openNewBiinsidePageDesign`: 打开报表设计页面

#### 5.4.2 报表交互功能

| 功能 | 实现方式 |
|------|----------|
| 分类展开/折叠 | 点击分类节点切换 `opend` 属性 |
| 报表搜索 | 输入报表名称实时过滤 |
| 报表关注 | 点击收藏图标（`collect-icon`） |
| 报表查看 | 点击报表节点加载报表内容到右侧iframe |

---

## 6. 技术栈分析

| 类别 | 技术/框架 | 文件路径 |
|------|-----------|----------|
| **报表核心模块** | vReport | `/seeyon/vreport/` |
| **UI组件库** | ctpUi | `/seeyon/common/ctpUi/dist/js/ctpUi.js` |
| **图标字体** | syIconfont | `/seeyon/skin/dist/fonts/syIconfont.css` |
| **jQuery** | jQuery 1.x | `/seeyon/common/all-min.js` |
| **加密模块** | crypto.js | `/seeyon/common/js/crypto.js` |

---

## 7. 页面架构与加载机制

### 7.1 加载时序

```
1. 页面加载 → 请求 vReport.do?method=vReportView
2. 服务器渲染左侧菜单HTML结构
3. 加载 vReport 相关JavaScript模块
4. 初始化报表管理组件
5. 绑定菜单交互事件（展开/折叠/点击）
6. 绑定搜索框事件
```

### 7.2 数据传递方式

报表菜单数据通过 **服务器端渲染** 直接输出到HTML中，而非AJAX请求：

```html
<div class="menu-block">
    <div parentid="0" id="-5613011561401137002" categoryid="-5613011561401137002" 
         category="true" opend="false" class="c-menu pmenu_0">
        <i class="vp-yishouqiwenjianjia package-icon"></i>
        <span>集团公共管理报表</span>
    </div>
    <!-- 报表节点 -->
    <div parentid="-5613011561401137002" id="-6736886960812044692" 
         reportid="-6736886960812044692" category="false" 
         class="c-menu pmenu_-5613011561401137002 report-node">
        <span class="vp-shoucang collect-icon" title="关注"></span>
        <span>【WBS】交付文档上传情况(博思集团)</span>
    </div>
</div>
```

---

## 8. 安全机制分析

### 8.1 认证机制

报表页面通过标准的Seeyon A8+认证机制：
- 登录态通过Session/Cookie管理
- 资源访问通过 `_resourceCode` 参数控制权限
- 报表数据按组织（如博思集团）隔离

### 8.2 权限控制

| 控制维度 | 实现方式 |
|----------|----------|
| 组织隔离 | 报表标题包含组织标识（博思集团） |
| 资源编码 | 通过 `_resourceCode=F08_report_view` 控制访问 |
| 角色权限 | 基于用户角色显示可访问的报表 |

---

## 9. 关联文档

| 文档名称 | 路径 |
|----------|------|
| 登录页面分析 | [01-Seeyon_A8_Login_Page_Analysis.md](file:///C:/IDEA/project/A8/01-Seeyon_A8_Login_Page_Analysis.md) |
| 主应用页面分析 | [02-Seeyon_A8_Main_Page_Analysis.md](file:///C:/IDEA/project/A8/02-Seeyon_A8_Main_Page_Analysis.md) |
| 待办详情页面分析 | [03-Seeyon_A8_Todo_Detail_Page_Analysis.md](file:///C:/IDEA/project/A8/03-Seeyon_A8_Todo_Detail_Page_Analysis.md) |
| 流程页面分析 | [04-Seeyon_A8_Process_Page_Analysis.md](file:///C:/IDEA/project/A8/04-Seeyon_A8_Process_Page_Analysis.md) |

---

## 10. 总结

报表分析页面是Seeyon A8+ OA系统中**核心的报表数据展示组件**，具有以下特点：

1. **分类树形结构**: 报表按业务领域分类组织，支持展开/折叠
2. **服务器端渲染**: 菜单数据通过服务器直接渲染到HTML，减少前端请求
3. **多组织支持**: 报表按组织隔离，支持集团化管理
4. **搜索功能**: 支持按报表名称实时搜索过滤
5. **关注功能**: 支持收藏常用报表
6. **模块化架构**: 基于vReport模块构建，包含多个功能子模块

报表系统涵盖了项目管理、工时管理、研发管理、运维管理、财信管理等多个业务领域，为企业提供全面的数据报表分析能力。