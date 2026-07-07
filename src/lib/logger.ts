import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import winston from 'winston';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 加载环境变量配置（从项目根目录的 .env 文件读取）
dotenv.config();

/**
 * 日志输出模式
 * - console: 仅控制台输出
 * - file: 仅文件输出
 * - both: 同时输出到控制台和文件
 */
export type LogOutputMode = 'console' | 'file' | 'both';

/**
 * 日志配置接口
 */
export interface LogConfig {
  /** 日志文件路径（相对或绝对路径） */
  filePath: string;
  /** 输出模式 */
  outputMode: LogOutputMode;
  /** 日志级别：error | warn | info | debug | verbose | silly */
  level: string;
}

/**
 * 从环境变量加载日志配置
 *
 * 读取以下环境变量：
 * - LOG_FILE_PATH：日志文件路径，默认 ./logs/app.log
 * - LOG_OUTPUT_MODE：输出模式（console/file/both），默认 both
 * - LOG_LEVEL：日志级别，默认 info
 */
export function loadLogConfig(): LogConfig {
  const outputMode = (process.env.LOG_OUTPUT_MODE as LogOutputMode) || 'both';
  const filePath = process.env.LOG_FILE_PATH || './logs/app.log';
  const level = process.env.LOG_LEVEL || 'info';
  return { filePath, outputMode, level };
}

/**
 * 确保日志文件所在目录存在
 */
function ensureLogDir(filePath: string): void {
  const dir = path.dirname(path.resolve(filePath));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 创建 winston 日志实例
 *
 * 根据 LOG_OUTPUT_MODE 配置项决定输出目标：
 * - console：仅控制台输出
 * - file：仅文件输出
 * - both：同时输出到控制台和文件
 */
function createLogger(): winston.Logger {
  const config = loadLogConfig();

  // 统一的日志格式：[时间] [级别] 消息
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  );

  const transports: winston.transport[] = [];

  if (config.outputMode === 'console' || config.outputMode === 'both') {
    transports.push(new winston.transports.Console({ format: logFormat }));
  }

  if (config.outputMode === 'file' || config.outputMode === 'both') {
    ensureLogDir(config.filePath);
    transports.push(
      new winston.transports.File({
        filename: config.filePath,
        format: logFormat,
      })
    );
  }

  return winston.createLogger({
    level: config.level,
    transports,
  });
}

/**
 * 全局日志实例
 *
 * 使用方式：
 * ```typescript
 * import { logger } from './logger';
 * logger.info('信息');
 * logger.error('错误');
 * logger.debug('调试');
 * ```
 */
export const logger = createLogger();

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
 *
 * 通过 winston logger 输出请求和响应日志，输出目标由环境变量
 * LOG_OUTPUT_MODE 控制（console/file/both）。
 */
export function setupLogger(axiosInstance: AxiosInstance): void {
  // 请求拦截器
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const separator = '─'.repeat(60);
      logger.info(`\n┌${separator}┐`);
      logger.info(`│ REQUEST`);
      logger.info(`├${separator}┤`);
      logger.info(`│ Method:   ${config.method?.toUpperCase()}`);
      logger.info(`│ URL:      ${config.baseURL || ''}${config.url || ''}`);
      if (config.params) {
        logger.info(`│ Params:   ${safeStringify(config.params)}`);
      }
      if (config.headers) {
        logger.info(`│ Headers:  ${safeStringify(config.headers)}`);
      }
      if (config.data) {
        const dataStr = typeof config.data === 'string' ? config.data : safeStringify(config.data);
        logger.info(`│ Data:     ${dataStr}`);
      }
      logger.info(`└${separator}┘`);
      return config;
    },
    (error) => {
      logger.error(`[REQUEST ERROR] ${error}`);
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      const separator = '─'.repeat(60);
      logger.info(`\n┌${separator}┐`);
      logger.info(`│ RESPONSE`);
      logger.info(`├${separator}┤`);
      logger.info(`│ Status:   ${response.status} ${response.statusText}`);
      logger.info(`│ URL:      ${response.config.baseURL || ''}${response.config.url || ''}`);
      if (response.headers) {
        logger.info(`│ Headers:  ${safeStringify(response.headers)}`);
      }
      logger.info(`│ Data:`);
      logger.info(formatResponseData(response.data));
      logger.info(`└${separator}┘`);
      return response;
    },
    (error) => {
      if (axios.isAxiosError(error) && error.response) {
        const separator = '─'.repeat(60);
        logger.info(`\n┌${separator}┐`);
        logger.info(`│ RESPONSE (ERROR)`);
        logger.info(`├${separator}┤`);
        logger.info(`│ Status:   ${error.response.status} ${error.response.statusText}`);
        logger.info(`│ URL:      ${error.config?.baseURL || ''}${error.config?.url || ''}`);
        if (error.response.headers) {
          logger.info(`│ Headers:  ${safeStringify(error.response.headers)}`);
        }
        logger.info(`│ Data:`);
        logger.info(formatResponseData(error.response.data));
        logger.info(`└${separator}┘`);
      } else {
        logger.error(`[RESPONSE ERROR] ${error.message}`);
      }
      return Promise.reject(error);
    }
  );
}
