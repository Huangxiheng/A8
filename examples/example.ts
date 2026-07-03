import { SeeyonClient } from '../src/lib';

async function main() {
  const client = new SeeyonClient({
    baseURL: 'http://120.35.0.67:28101/seeyon',
    debug: true,
  });

  const result = await client.login('your_username', 'your_password');
  console.log('\n登录结果:', result);
}

main().catch(console.error);
