import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';
import { setupLogger } from './logger';

export interface SeeyonClientConfig {
  /** 服务器基础地址，如 http://120.35.0.67:28101/seeyon */
  baseURL: string;
  /** 请求超时时间（毫秒），默认 30000 */
  timeout?: number;
  /** 是否打印请求/响应日志，默认 true */
  debug?: boolean;
}

export interface LoginResult {
  /** 是否登录成功 */
  success: boolean;
  /** 结果消息 */
  message?: string;
  /** 登录成功后的 JSESSIONID */
  sessionId?: string;
}

/**
 * 待办事项查询参数
 */
export interface PendingListParams {
  /** 页码，从1开始 */
  page?: number;
  /** 每页数量，默认200 */
  size?: number | string;
  /** 标题（模糊查询） */
  subject?: string;
  /** 重要程度 */
  importantLevel?: string;
  /** 创建日期 */
  createDate?: string;
  /** 模板名称 */
  templateName?: string;
  /** 去重 */
  deduplication?: string;
  /** AI处理 */
  aiProcessing?: string;
  /** 发起人姓名 */
  startMemberName?: string;
  /** 上一处理人姓名 */
  preApproverName?: string;
  /** 接收日期 */
  receiveDate?: string;
  /** 预期处理时间 */
  expectprocesstime?: string;
  /** 子状态 */
  subState?: string;
  /** 是否超期 */
  isOverdue?: string;
}

/**
 * 单个待办事项
 */
export interface PendingItem {
  /** 待办ID */
  affairId: string;
  /** 标题 */
  subject: string;
  /** 发起人姓名 */
  startMemberName: string;
  /** 开始日期 */
  startDate: string;
  /** 创建日期 */
  createDate: string;
  /** 完成日期 */
  finishDate: string | null;
  /** 接收时间 */
  receiveTime: string;
  /** 节点截止时间名称 */
  nodeDeadLineName: string;
  /** 催办次数 */
  hastenTimes: number;
  /** 子状态码 */
  subState: number;
  /** 流程ID */
  processId: string;
  /** 摘要ID */
  summaryId: string;
  /** 是否超时 */
  isCoverTime: boolean;
  /** 流程是否超时 */
  processIsCoverTime: boolean;
  /** 截止日期 */
  deadLineDate: string;
  /** 状态 */
  state: number;
  /** 正文类型 */
  bodyType: string;
  /** 是否有附件 */
  hasAttsFlag: boolean;
  /** 是否超级节点 */
  superNode: boolean;
  /** 重要级别 */
  importantLevel: number;
  /** 是否代理 */
  proxy: boolean;
  /** 子状态名称 */
  subStateName: string;
  /** 流程截止时间名称 */
  processDeadLineName: string;
  /** 流程截止时间 */
  processDeadline: string | null;
  /** 是否跟踪 */
  isTrack: boolean;
  /** 跟踪类型 */
  trackType: number;
  /** 显示权限按钮 */
  showAuthorityButton: boolean;
  /** 发起人ID */
  startMemberId: string;
  /** 处理时间 */
  dealTime: string | null;
  /** 组织账号ID */
  orgAccountId: string;
  /** 新流程类型 */
  newflowType: number;
  /** 提前提醒 */
  advanceRemind: string | null;
  /** 流程是否完成 */
  flowFinished: boolean;
  /** 模板ID */
  templeteId: string;
  /** 案例ID */
  caseId: string;
  /** 是否可删除或归档 */
  canDeleteORarchive: boolean;
  /** 工作项ID */
  workitemId: string;
  /** 活动ID */
  activityId: string;
  /** 当前节点信息 */
  currentNodesInfo: string;
  /** 回退来源ID */
  backFromId: string | null;
  /** 是否已收藏 */
  hasFavorite: boolean;
  /** 是否可转发 */
  canForward: boolean;
  /** 回复数量 */
  replyCounts: number | null;
  /** 来源ID */
  fromId: string | null;
  /** 预期处理时间 */
  expectedProcessTime: string | null;
  /** 节点名称 */
  nodeName: string;
  /** 待办状态 */
  affairState: number;
  /** 上一处理人姓名 */
  preApproverName: string;
  /** 摘要状态 */
  summaryState: number;
  /** 表单应用ID */
  formAppId: string;
  /** 表单查看操作 */
  formViewOperation: string;
  /** 表单记录ID */
  formRecordid: string;
  /** 是否可移除 */
  canReMove: boolean;
  /** 待办归档ID */
  affairArchiveId: string | null;
  /** 打印 */
  print: number;
  /** 是否已打印 */
  hasPrint: string;
  /** 阅读状态 */
  readState: number;
  /** 成员ID */
  memberId: string;
  /** 待办节点名称 */
  affairNodeName: string;
  /** 密级名称 */
  secretName: string | null;
  /** 父表单摘要ID */
  parentformSummaryid: string | null;
  /** 取消意见策略 */
  cancelOpinionPolicy: number;
  /** 不同意意见策略 */
  disAgreeOpinionPolicy: number;
  /** 是否可编辑 */
  canEdit: boolean;
  /** 是否抢办 */
  grab: boolean;
}

/**
 * 待办列表查询结果
 */
export interface PendingListResult {
  /** 总数 */
  total: number;
  /** 总页数 */
  pages: number;
  /** 待办列表 */
  data: PendingItem[];
  /** 每页数量 */
  size: number;
  /** 是否显示总数 */
  showTotal: boolean;
  /** 当前页码 */
  page: number;
}

/**
 * 【财信】运维工单全量表-效能 报表的设计ID
 */
export const PERFORMANCE_TABLE_DESIGN_ID = '6387641023490640230';

/**
 * 【财信】运维工单全量表-效能 报表的表别名
 */
export const PERFORMANCE_TABLE_ALIAS = 'formmain_0600_wea';

/**
 * 【财信】运维工单全量表-效能 报表常用查询字段名
 * - field0125 来源工单号
 * - field0139 运维工单号
 * - field0140 开发工单号
 * - field0141 缺陷问题单号
 */
export const PERFORMANCE_TABLE_FIELD = {
  SOURCE_ORDER_NUMBER: 'field0125',
  OPS_ORDER_NUMBER: 'field0139',
  DEV_ORDER_NUMBER: 'field0140',
  DEFECT_ORDER_NUMBER: 'field0141',
} as const;

/**
 * 报表查询条件
 */
export interface QueryTableCondition {
  /** 左侧字符，通常为 "(" 或 ""，默认 "" */
  leftChar?: string;
  /** 别名表名，默认 formmain_0600_wea */
  aliasTableName?: string;
  /** 字段名，如 field0140 */
  fieldName: string;
  /** 操作符，默认 Like */
  operation?: string;
  /** 字段值 */
  fieldValue: string;
  /** 右侧字符，通常为 ")" 或 ""，默认 "" */
  rightChar?: string;
  /** 行间操作符 "and" / "or"，默认 and */
  rowOperation?: string;
}

/**
 * 报表自定义排序字段
 */
export interface CustomOrderField {
  /** 别名表名 */
  aliasTableName?: string;
  /** 字段名 */
  fieldName: string;
  /** 排序方式，默认 asc */
  orderType?: 'asc' | 'desc';
}

/**
 * 报表表格查询参数
 */
export interface QueryTableResultParams {
  /** 页码，从1开始，默认 1 */
  page?: number;
  /** 每页数量，默认 50 */
  size?: number;
  /** 报表设计ID */
  designId: string;
  /** 用户查询条件，默认空数组 */
  userConditions?: QueryTableCondition[];
  /** 条件ID，默认空字符串 */
  conditionId?: string;
  /** 自定义排序字段，默认空数组 */
  customOrderFields?: CustomOrderField[];
  /** 是否返回总数，默认 true */
  needTotal?: boolean;
  /** 视图模式，默认 view */
  viewModel?: string;
  /** 扩展参数，默认空对象 */
  extParams?: Record<string, unknown>;
}

/**
 * 报表字段元信息
 */
export interface QueryTableField {
  /** 显示名 */
  display: string;
  /** 字段键名，如 formmain_0600_wea_field0139 */
  key: string;
  /** 字段组件类型，如 text、member、datetime、select */
  fieldComType: string | null;
  /** 格式类型，如 yyyy-mm-dd */
  formatType: string | null;
  /** 是否允许排序 */
  enableSort: boolean;
  /** 数据列索引 */
  dataIndex: number;
  /** 是否显示 */
  showOrHide: boolean;
  /** 是否自动宽度 */
  autoWidth: boolean;
  /** 列宽 */
  width: number | null;
}

/**
 * 报表数据行
 * 键为字段 dataIndex（字符串形式），值为 { v: 任意值 }
 * 可能包含 rcp（可穿透标识）和 rpp（穿透参数）
 */
export interface QueryTableRow {
  [dataIndex: string]: { v: unknown } | boolean | Record<string, unknown> | undefined;
  /** 是否可穿透（钻取） */
  rcp?: boolean;
  /** 穿透参数 */
  rpp?: {
    _weaModelId_?: string;
    id?: string;
    _designId_?: string;
    [key: string]: unknown;
  };
}

/**
 * 报表表格查询结果
 */
export interface QueryTableResult {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  msg: string | null;
  /** 字段元信息列表 */
  fields: QueryTableField[];
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  size: number;
  /** 总页数 */
  pages: number;
  /** 总数 */
  total: number;
  /** 数据行 */
  data: QueryTableRow[];
  /** 是否可穿透 */
  penetratable: boolean;
}

/**
 * 从报表数据行中提取指定字段的值
 * @param row 数据行
 * @param field 字段元信息或 dataIndex（数字或字符串）
 * @returns 字段值，不存在时返回 undefined
 */
export function getCellValue(
  row: QueryTableRow,
  field: QueryTableField | number | string
): unknown {
  const dataIndex = typeof field === 'object' ? String(field.dataIndex) : String(field);
  const cell = row[dataIndex];
  if (cell && typeof cell === 'object' && !Array.isArray(cell) && 'v' in cell) {
    return (cell as { v: unknown }).v;
  }
  return undefined;
}

export class SeeyonClient {
  private config: Required<SeeyonClientConfig>;
  private axiosInstance: AxiosInstance;
  private _sessionId: string | null = null;

  constructor(config: SeeyonClientConfig) {
    this.config = {
      timeout: 30000,
      debug: true,
      ...config,
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/plain',
      },
    });

    // 安装日志拦截器
    if (this.config.debug) {
      setupLogger(this.axiosInstance);
    }
  }

  /** 获取当前 JSESSIONID */
  get sessionId(): string | null {
    return this._sessionId;
  }

  /**
   * 用户名密码登录
   */
  async login(username: string, password: string): Promise<LoginResult> {
    try {
      // 1. 获取加密种子
      const seed = await this.updateSecuritySeed();

      // 2. DES 加密密码
      const encryptedPassword = this.encryptPassword(password, seed);

      // 3. 构造登录表单数据
      const formData = new URLSearchParams();
      formData.append('login_username', username);
      formData.append('login_password', encryptedPassword);
      formData.append('login.timezone', this.getTimeZoneId());
      formData.append('login.validatePwdStrength', '3');
      formData.append('fontSize', '12');
      formData.append('screenWidth', '1920');
      formData.append('screenHeight', '1080');

      // 4. 提交登录请求
      const response = await this.axiosInstance.post('/main.do?method=login', formData.toString(), {
        headers: this.buildHeaders(),
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      // 5. 从响应中提取 JSESSIONID
      const sessionId = this.extractSessionId(response);

      // 6. 判断登录结果
      const responseData = typeof response.data === 'string' ? response.data : String(response.data);
      // 302 重定向时响应体为空，通过响应头 loginok 判断
      const loginOkHeader = response.headers['loginok'];
      const isSuccess = responseData.startsWith('ok') || loginOkHeader === 'ok';

      if (isSuccess) {
        this._sessionId = sessionId;
        return {
          success: true,
          message: '登录成功',
          sessionId: sessionId || undefined,
        };
      } else {
        // 响应可能是错误信息、HTML 页面等
        const message = responseData.length < 200 ? responseData : responseData.substring(0, 200) + '...';
        return {
          success: false,
          message,
          sessionId: sessionId || undefined,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `登录请求失败: ${message}`,
      };
    }
  }

  /**
   * 构建包含 JSESSIONID 的请求头
   */
  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/plain',
      ...extra,
    };
    if (this._sessionId) {
      headers['Cookie'] = `JSESSIONID=${this._sessionId}`;
    }
    return headers;
  }

  /**
   * 获取加密种子，同时从响应中提取 JSESSIONID 并保存
   * 服务器会将加密种子与 session 绑定，登录时必须携带同一个 session
   */
  private async updateSecuritySeed(): Promise<string> {
    const response = await this.axiosInstance.get('/main.do?method=updateLoginSeed', {
      responseType: 'text',
      headers: this.buildHeaders(),
    });

    // 从 updateLoginSeed 响应中提取 JSESSIONID，后续登录请求需要携带
    const sessionId = this.extractSessionId(response);
    if (sessionId) {
      this._sessionId = sessionId;
    }

    const data = typeof response.data === 'string' ? response.data : String(response.data);
    if (data && data.trim() !== '') {
      return data.trim();
    }

    throw new Error('获取加密种子失败：服务器返回空值');
  }

  /**
   * DES 加密密码（与浏览器端 CryptoJS.DES.encrypt 行为一致）
   */
  private encryptPassword(password: string, seed: string): string {
    const utf8Bytes = CryptoJS.enc.Utf8.parse(password);
    const encrypted = CryptoJS.DES.encrypt(utf8Bytes, seed);
    return encrypted.toString();
  }

  /**
   * 从响应的 Set-Cookie 头中提取 JSESSIONID
   */
  private extractSessionId(response: AxiosResponse): string | null {
    const setCookie = response.headers['set-cookie'];
    if (!setCookie) return null;

    // set-cookie 可能是字符串或字符串数组
    const cookies: string[] = Array.isArray(setCookie) ? setCookie : [setCookie];

    for (const cookie of cookies) {
      const match = cookie.match(/JSESSIONID=([^;]+)/);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * 获取时区 ID
   */
  private getTimeZoneId(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'Asia/Shanghai';
    }
  }

  /**
   * 查询待办事项列表
   * @param params 查询参数
   * @returns 待办列表结果
   */
  async getPendingList(params: PendingListParams = {}): Promise<PendingListResult> {
    if (!this._sessionId) {
      throw new Error('请先调用 login() 方法登录');
    }

    // 构造分页参数
    const page = params.page ?? 1;
    const size = params.size ?? 200;

    // 构造查询条件，过滤掉undefined和null值
    const queryParams: Record<string, string> = {};
    const queryFields = [
      'subject',
      'importantLevel',
      'createDate',
      'templateName',
      'deduplication',
      'aiProcessing',
      'startMemberName',
      'preApproverName',
      'receiveDate',
      'expectprocesstime',
      'subState',
      'isOverdue',
    ] as const;

    for (const field of queryFields) {
      const value = params[field];
      if (value !== undefined && value !== null) {
        queryParams[field] = String(value);
      }
    }

    // 构造arguments参数
    const argumentsArray = [
      { page, size: String(size) },
      {
        subject: queryParams.subject ?? '',
        importantLevel: queryParams.importantLevel ?? '',
        createDate: queryParams.createDate ?? '',
        templateName: queryParams.templateName ?? '',
        deduplication: queryParams.deduplication ?? 'false',
        aiProcessing: queryParams.aiProcessing ?? 'false',
        startMemberName: queryParams.startMemberName ?? '',
        preApproverName: queryParams.preApproverName ?? '',
        receiveDate: queryParams.receiveDate ?? '',
        expectprocesstime: queryParams.expectprocesstime ?? '',
        subState: queryParams.subState ?? '',
        isOverdue: queryParams.isOverdue ?? '',
      },
    ];

    // 构造请求体
    const formData = new URLSearchParams();
    formData.append('managerMethod', 'getPendingList');
    formData.append('arguments', JSON.stringify(argumentsArray));

    // 生成随机数
    const rnd = Math.floor(Math.random() * 100000);

    // 发送请求
    const response = await this.axiosInstance.post<PendingListResult>(
      `/ajax.do?method=ajaxAction&managerName=colManager&rnd=${rnd}`,
      formData.toString(),
      {
        headers: this.buildHeaders({
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          requesttype: 'AJAX',
        }),
      }
    );

    return response.data;
  }

  /**
   * 查询报表表格数据
   *
   * 对应 `resultAjaxManager.queryTableResult`，可查询任意 designId 指定的报表。
   * 查询【财信】运维工单全量表-效能 时可使用 `PERFORMANCE_TABLE_DESIGN_ID` 常量。
   *
   * @param params 查询参数
   * @returns 报表查询结果
   */
  async queryTableResult(params: QueryTableResultParams): Promise<QueryTableResult> {
    if (!this._sessionId) {
      throw new Error('请先调用 login() 方法登录');
    }

    const page = params.page ?? 1;
    const size = params.size ?? 50;

    // 构造查询条件，应用默认值
    const userConditions = (params.userConditions ?? []).map((c) => ({
      leftChar: c.leftChar ?? '',
      aliasTableName: c.aliasTableName ?? PERFORMANCE_TABLE_ALIAS,
      fieldName: c.fieldName,
      operation: c.operation ?? 'Like',
      fieldValue: c.fieldValue,
      rightChar: c.rightChar ?? '',
      rowOperation: c.rowOperation ?? 'and',
    }));

    // 构造 arguments 参数（数组包含一个对象）
    const argumentsArray = [
      {
        page,
        size,
        designId: params.designId,
        userConditions,
        conditionId: params.conditionId ?? '',
        customOrderFields: params.customOrderFields ?? [],
        needTotal: params.needTotal ?? true,
        viewModel: params.viewModel ?? 'view',
        extParams: params.extParams ?? {},
      },
    ];

    // 构造请求体
    const formData = new URLSearchParams();
    formData.append('managerMethod', 'queryTableResult');
    formData.append('arguments', JSON.stringify(argumentsArray));

    // 生成随机数
    const rnd = Math.floor(Math.random() * 100000);

    // 发送请求
    const response = await this.axiosInstance.post<QueryTableResult>(
      `/ajax.do?method=ajaxAction&managerName=resultAjaxManager&rnd=${rnd}`,
      formData.toString(),
      {
        headers: this.buildHeaders({
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          requesttype: 'AJAX',
        }),
      }
    );

    return response.data;
  }
}
