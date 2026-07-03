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
}
