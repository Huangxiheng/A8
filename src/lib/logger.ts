import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';

/**
 * 安全地将对象转换为 JSON 字符串，处理循环引用
 */
export function safeStringify(obj: unknown, space?: number): string {
  if (obj === undefined) return 'undefined';
  if (obj === null) return 'null';
  if (typeof obj === 'string') return obj;
  if (typeof obj !== 'object') return String(obj);

  // 二进制类型：输出类型和大小信息
  if (typeof ArrayBuffer !== 'undefined' && obj instanceof ArrayBuffer) {
    return `[ArrayBuffer: ${obj.byteLength} bytes]`;
  }
  if (typeof Buffer !== 'undefined' && obj instanceof Buffer) {
    return `[Buffer: ${obj.length} bytes]`;
  }
  // Stream 类型
  if (typeof obj === 'object' && obj !== null && typeof (obj as Record<string, unknown>).pipe === 'function') {
    return `[Stream: ${obj.constructor.name}]`;
  }

  const seen = new WeakSet();
  try {
    return JSON.stringify(
      obj,
      (key: string, value: unknown) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      },
      space
    );
  } catch {
    return String(obj);
  }
}

/**
 * 格式化响应体数据用于日志输出
 */
function formatResponseData(data: unknown): string {
  if (data === undefined) return 'undefined';
  if (data === null) return 'null';
  if (typeof data === 'string') {
    // 字符串过长时截断显示
    return data.length > 500 ? data.substring(0, 500) + `... (${data.length} chars total)` : data;
  }
  if (typeof data !== 'object') return String(data);

  // 二进制类型
  if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
    return `[ArrayBuffer: ${data.byteLength} bytes]`;
  }
  if (typeof Buffer !== 'undefined' && data instanceof Buffer) {
    return `[Buffer: ${data.length} bytes]`;
  }
  if (typeof data === 'object' && data !== null && typeof (data as Record<string, unknown>).pipe === 'function') {
    return `[Stream: ${data.constructor.name}]`;
  }

  // 普通对象：用 safeStringify 处理
  return safeStringify(data, 2);
}

/**
 * 为 axios 实例安装请求/响应日志拦截器
 */
export function setupLogger(axiosInstance: AxiosInstance): void {
  // 请求拦截器
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const separator = '─'.repeat(60);
      console.log(`\n┌${separator}┐`);
      console.log(`│ REQUEST`);
      console.log(`├${separator}┤`);
      console.log(`│ Method:   ${config.method?.toUpperCase()}`);
      console.log(`│ URL:      ${config.baseURL || ''}${config.url || ''}`);
      if (config.params) {
        console.log(`│ Params:   ${safeStringify(config.params)}`);
      }
      if (config.headers) {
        console.log(`│ Headers:  ${safeStringify(config.headers)}`);
      }
      if (config.data) {
        const dataStr = typeof config.data === 'string' ? config.data : safeStringify(config.data);
        console.log(`│ Data:     ${dataStr}`);
      }
      console.log(`└${separator}┘`);
      return config;
    },
    (error) => {
      console.error('[REQUEST ERROR]', error);
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      const separator = '─'.repeat(60);
      console.log(`\n┌${separator}┐`);
      console.log(`│ RESPONSE`);
      console.log(`├${separator}┤`);
      console.log(`│ Status:   ${response.status} ${response.statusText}`);
      console.log(`│ URL:      ${response.config.baseURL || ''}${response.config.url || ''}`);
      if (response.headers) {
        console.log(`│ Headers:  ${safeStringify(response.headers)}`);
      }
      console.log(`│ Data:`);
      console.log(formatResponseData(response.data));
      console.log(`└${separator}┘`);
      return response;
    },
    (error) => {
      if (axios.isAxiosError(error) && error.response) {
        const separator = '─'.repeat(60);
        console.log(`\n┌${separator}┐`);
        console.log(`│ RESPONSE (ERROR)`);
        console.log(`├${separator}┤`);
        console.log(`│ Status:   ${error.response.status} ${error.response.statusText}`);
        console.log(`│ URL:      ${error.config?.baseURL || ''}${error.config?.url || ''}`);
        if (error.response.headers) {
          console.log(`│ Headers:  ${safeStringify(error.response.headers)}`);
        }
        console.log(`│ Data:`);
        console.log(formatResponseData(error.response.data));
        console.log(`└${separator}┘`);
      } else {
        console.error('[RESPONSE ERROR]', error.message);
      }
      return Promise.reject(error);
    }
  );
}
