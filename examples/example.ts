import {
  SeeyonClient,
  PERFORMANCE_TABLE_DESIGN_ID,
  PERFORMANCE_TABLE_FIELD,
  getCellValue,
} from '../src/lib';

async function main() {
  const client = new SeeyonClient({
    baseURL: 'http://120.35.0.67:28101/seeyon',
    debug: true,
  });

  // 登录
  const loginResult = await client.login('your_username', 'your_password');
  console.log('\n登录结果:', loginResult);

  if (!loginResult.success) {
    return;
  }

  // 查询待办列表
  console.log('\n正在查询待办列表...');
  const pendingList = await client.getPendingList({
    page: 1,
    size: 200,
  });
  console.log(`待办总数: ${pendingList.total}`);

  // 查询【财信】运维工单全量表-效能 报表
  // 按开发工单号模糊查询
  console.log('\n正在查询【财信】运维工单全量表-效能 报表...');
  const tableResult = await client.queryTableResult({
    designId: PERFORMANCE_TABLE_DESIGN_ID,
    page: 1,
    size: 50,
    userConditions: [
      {
        fieldName: PERFORMANCE_TABLE_FIELD.DEV_ORDER_NUMBER,
        fieldValue: 'KFXQ-CX-2026040100180',
        operation: 'Like',
      },
    ],
  });

  console.log(`\n报表查询成功: ${tableResult.success}`);
  console.log(`总数: ${tableResult.total}, 页数: ${tableResult.pages}`);
  console.log(`字段数量: ${tableResult.fields.length}`);

  // 遍历数据行，按字段 display 名输出
  for (const row of tableResult.data) {
    console.log('\n--- 行数据 ---');
    for (const field of tableResult.fields) {
      const value = getCellValue(row, field);
      console.log(`${field.display}: ${value ?? ''}`);
    }
  }
}

main().catch(console.error);
