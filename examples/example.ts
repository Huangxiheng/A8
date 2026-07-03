import { SeeyonClient } from '../src/lib';

async function main() {
  const client = new SeeyonClient({
    baseURL: 'http://120.35.0.67:28101/seeyon',
    debug: true,
  });

  // 登录
  const loginResult = await client.login('your_username', 'your_password');
  console.log('\n登录结果:', loginResult);

  if (loginResult.success) {
    // 查询待办列表
    console.log('\n正在查询待办列表...');
    const pendingList = await client.getPendingList({
      page: 1,
      size: 200,
    });
    

  }
}

main().catch(console.error);
