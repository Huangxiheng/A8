import {
  SeeyonClient,
  PERFORMANCE_TABLE_DESIGN_ID,
  PERFORMANCE_TABLE_FIELD,
  getCellValue,
  QueryTableResult,
  QueryTableField,
  QueryTableRow,
  logger,
} from '../src/lib';
import ExcelJS from 'exceljs';
import path from 'path';

// ============================================================================
// 常量定义
// ============================================================================

/** 获取当前文件的目录路径（解决 ES 模块 __dirname 未定义问题） */
const __dirname = path.resolve(process.cwd(), 'examples');

/** 输入文件路径（相对于本脚本） */
const INPUT_FILE_PATH = path.resolve(__dirname, '../data/日报.xlsx');

/** 输出文件路径（相对于本脚本） */
const OUTPUT_FILE_PATH = path.resolve(__dirname, '../data/日报_已填充.xlsx');

/** 需要填入的目标字段名（对应报表中的 display 名称） */
const TARGET_FIELDS = [
  '提出日期',
  '当前待办人',
  '当前待办节点',
  '开发人员',
] as const;

/** 编号前缀与查询字段的映射规则 */
const PREFIX_FIELD_MAP: Record<string, string> = {
  QXWT: PERFORMANCE_TABLE_FIELD.DEFECT_ORDER_NUMBER, // 缺陷问题单号
  KFXQ: PERFORMANCE_TABLE_FIELD.DEV_ORDER_NUMBER, // 开发工单号
  YWGD: PERFORMANCE_TABLE_FIELD.OPS_ORDER_NUMBER, // 运维工单号
};

/** 用于回退查询的所有字段（当主查询无结果时） */
const ALL_QUERY_FIELDS = [
  PERFORMANCE_TABLE_FIELD.SOURCE_ORDER_NUMBER, // 来源工单号
  PERFORMANCE_TABLE_FIELD.OPS_ORDER_NUMBER, // 运维工单号
  PERFORMANCE_TABLE_FIELD.DEV_ORDER_NUMBER, // 开发工单号
  PERFORMANCE_TABLE_FIELD.DEFECT_ORDER_NUMBER, // 缺陷问题单号
];

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 根据编号前缀获取对应的查询字段
 * @param code A8 单号
 * @returns 对应的字段名，如果前缀不匹配则返回 null
 */
function getFieldByPrefix(code: string): string | null {
  for (const [prefix, fieldName] of Object.entries(PREFIX_FIELD_MAP)) {
    if (code.startsWith(prefix)) {
      return fieldName;
    }
  }
  return null;
}

/**
 * 从 A8 单号中提取末尾数字
 * 例如：'KFXQ-CX-2026040100180' → '2026040100180' → 提取数字部分
 * @param code A8 单号
 * @returns 末尾的数字字符串
 */
function extractTrailingNumber(code: string): string {
  // 匹配末尾的连续数字
  const match = code.match(/\d+$/);
  return match ? match[0] : code;
}

/**
 * 查找报表字段中指定 display 名称的字段
 * @param fields 字段列表
 * @param displayName 字段显示名称
 * @returns 找到的字段或 undefined
 */
function findFieldByDisplay(
  fields: QueryTableField[],
  displayName: string
): QueryTableField | undefined {
  return fields.find((f) => f.display === displayName);
}

/**
 * 从查询结果行中提取目标字段的值
 * @param row 数据行（QueryTableRow 类型）
 * @param fields 字段列表
 * @param targetFieldName 目标字段名称
 * @returns 字段值或空字符串
 */
function extractFieldValue(
  row: QueryTableRow,
  fields: QueryTableField[],
  targetFieldName: string
): string {
  const field = findFieldByDisplay(fields, targetFieldName);
  if (!field) return '';
  const value = getCellValue(row, field);
  return value ? String(value) : '';
}

// ============================================================================
// 查询函数
// ============================================================================

/**
 * 使用指定字段和值查询报表数据
 * @param client SeeyonClient 实例
 * @param fieldName 字段名
 * @param fieldValue 字段值
 * @returns 查询结果
 */
async function queryByField(
  client: SeeyonClient,
  fieldName: string,
  fieldValue: string
): Promise<QueryTableResult> {
  return client.queryTableResult({
    designId: PERFORMANCE_TABLE_DESIGN_ID,
    page: 1,
    size: 50,
    userConditions: [
      {
        fieldName,
        fieldValue,
        operation: 'Like',
      },
    ],
  });
}

/**
 * 查询 A8 单号，支持主查询和回退查询
 * @param client SeeyonClient 实例
 * @param code A8 单号
 * @returns 查询结果和处理类型
 */
async function queryCode(
  client: SeeyonClient,
  code: string
): Promise<{
  result: QueryTableResult | null;
  queryType: 'primary' | 'fallback' | 'none';
  matchedField: string | null;
}> {
  // 1. 首先尝试根据前缀进行主查询
  const primaryField = getFieldByPrefix(code);
  if (primaryField) {
    logger.info(`  [主查询] 使用字段 ${primaryField} 查询: ${code}`);
    const result = await queryByField(client, primaryField, code);
    if (result.data.length > 0) {
      logger.info(`  [主查询] 成功，找到 ${result.data.length} 条记录`);
      return { result, queryType: 'primary', matchedField: primaryField };
    }
    logger.info(`  [主查询] 无结果，尝试回退查询...`);
  }

  // 2. 回退查询：使用末尾数字轮流查询四个字段
  const trailingNumber = extractTrailingNumber(code);
  logger.info(`  [回退查询] 使用末尾数字 "${trailingNumber}" 轮流查询...`);

  for (const fieldName of ALL_QUERY_FIELDS) {
    logger.info(`  [回退查询] 尝试字段 ${fieldName}...`);
    const result = await queryByField(client, fieldName, trailingNumber);
    if (result.data.length === 1) {
      logger.info(`  [回退查询] 命中，找到 1 条记录`);
      return { result, queryType: 'fallback', matchedField: fieldName };
    } else if (result.data.length > 1) {
      logger.info(`  [回退查询] 找到 ${result.data.length} 条记录（多条，跳过）`);
      // 多条结果，继续尝试其他字段
    }
  }

  logger.info(`  [查询失败] 未找到匹配记录`);
  return { result: null, queryType: 'none', matchedField: null };
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  // 初始化客户端
  const client = new SeeyonClient({
    baseURL: 'http://120.35.0.67:28101/seeyon',
    debug: true,
  });

  // 从环境变量读取用户名和密码，未配置时使用默认值
  const username = process.env.SEYON_USERNAME || '1000664';
  const password = process.env.SEYON_PASSWORD || 'qwer1234!';
  
  // 登录
  logger.info('========================================');
  logger.info('正在登录...');
  const loginResult = await client.login(username, password);
  logger.info(`登录结果: ${JSON.stringify(loginResult)}`);
  if (!loginResult.success) {
    logger.error('登录失败，程序退出');
    return;
  }
  logger.info('========================================');

  // 读取输入的 Excel 文件
  logger.info(`读取输入文件: ${INPUT_FILE_PATH}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(INPUT_FILE_PATH);

  // 获取第一个工作表
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    logger.error('Excel 文件中没有工作表');
    return;
  }

  // 获取总行数（包含表头）
  const rowCount = worksheet.rowCount;
  logger.info(`总行数: ${rowCount}`);

  // 添加新列（从第8列开始，索引为7）：提出日期、当前待办人、当前待办节点、开发人员、修改时间_系统
  // 第8列对应索引7，依次添加5列
  const startColIndex = 7; // 第8列的0-based索引
  TARGET_FIELDS.forEach((fieldName, i) => {
    const cell = worksheet.getRow(1).getCell(startColIndex + i + 1);
    cell.value = fieldName;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
  });

  // 遍历数据行（跳过第一行表头）
  for (let rowNum = 2; rowNum <= rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    // 读取第三列（索引2）的A8单号
    const codeCell = row.getCell(3);
    const code = String(codeCell.value || '').trim();

    if (!code) {
      logger.info(`第 ${rowNum} 行: 第三列为空，跳过`);
      continue;
    }

    logger.info(`========================================`);
    logger.info(`处理第 ${rowNum} 行: ${code}`);

    // 查询单号
    const { result, queryType, matchedField } = await queryCode(client, code);

    // 处理查询结果
    if (!result || result.data.length === 0) {
      logger.info(`  未找到数据，保持单元格为空`);
      // 保持单元格为空（不做任何操作）
      continue;
    }

    if (result.data.length > 1) {
      logger.info(`  找到 ${result.data.length} 条记录，多条结果暂不处理（后续补充逻辑）`);
      // 多条结果，保持空（后续补充处理逻辑）
      continue;
    }

    // 单条结果，正常处理：提取字段值并填入表格
    const dataRow = result.data[0];
    logger.info(`  找到 1 条记录，填充数据...`);

    TARGET_FIELDS.forEach((targetField, i) => {
      const value = extractFieldValue(dataRow, result.fields, targetField);
      const cell = row.getCell(startColIndex + i + 1);
      cell.value = value;
      logger.info(`    ${targetField}: ${value}`);
    });
  }

  // 保存结果文件
  await workbook.xlsx.writeFile(OUTPUT_FILE_PATH);
  logger.info(`========================================`);
  logger.info(`处理完成！`);
  logger.info(`输出文件: ${OUTPUT_FILE_PATH}`);
}

main().catch((err) => logger.error(err));
