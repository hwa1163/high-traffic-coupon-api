const fetch = global.fetch;

const BASE_URL = 'http://localhost:3000';
const COUNT = 150;

async function createUser(i) {
  return fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: `user${i}@test.com`,
      nickname: `user${i}`,
    }),
  });
}

async function main() {
  const promises = [];

  for (let i = 1; i <= COUNT; i++) {
    promises.push(createUser(i));
  }

  await Promise.all(promises);

  console.log('유저 생성 완료');
}

main();