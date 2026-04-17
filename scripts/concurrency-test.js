/**
 * 동시성 테스트 스크립트
 *
 * 목적:
 * - 서로 다른 유저 여러 명이 동시에 쿠폰 발급 요청을 보냈을 때
 *   totalQuantity 이상 발급되지 않는지 확인
 *
 * 테스트 시나리오 예시:
 * - 쿠폰 총 수량: 100
 * - 서로 다른 유저: 150명
 * - 기대 결과:
 *   성공 100건
 *   실패 50건
 *
 * 실행 방법:
 * node scripts/concurrency-test.js
 */

const BASE_URL = 'http://localhost:3000';
const COUPON_ID = 1;

/**
 * 테스트 요청 수
 * - 예: 150명이 동시에 요청
 */
const REQUEST_COUNT = 150;

/**
 * 시작 유저 ID
 * - userId 1부터 150까지 사용하려면 1
 */
const START_USER_ID = 1;

/**
 * 완전 동시 요청 여부
 * - true  : Promise.all 로 한 번에 전송
 * - false : 배치 단위로 끊어서 전송
 *
 */
const FULL_CONCURRENCY = true;

/**
 * 배치 크기
 * - FULL_CONCURRENCY = false 일 때만 사용
 */
const BATCH_SIZE = 50;

/**
 * 발급 요청 1건 실행
 */
async function issueCoupon(userId) {
  const startedAt = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/coupons/${COUPON_ID}/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const text = await response.text();

    let parsedBody;
    try {
      parsedBody = JSON.parse(text);
    } catch {
      parsedBody = { raw: text };
    }

    return {
      userId,
      ok: response.ok,
      status: response.status,
      durationMs: Date.now() - startedAt,
      body: parsedBody,
    };
  } catch (error) {
    return {
      userId,
      ok: false,
      status: 0,
      durationMs: Date.now() - startedAt,
      body: {
        message: error.message,
      },
    };
  }
}

/**
 * 결과 요약 집계
 */
function summarizeResults(results) {
  const summary = {
    totalRequests: results.length,
    successCount: 0,
    failCount: 0,

    duplicateCount: 0,
    soldOutCount: 0,
    invalidStateCount: 0,
    notFoundCount: 0,
    serverErrorCount: 0,
    networkErrorCount: 0,
    unknownFailCount: 0,

    minDurationMs: null,
    maxDurationMs: null,
    avgDurationMs: 0,
  };

  let totalDuration = 0;

  for (const result of results) {
    totalDuration += result.durationMs;

    if (summary.minDurationMs === null || result.durationMs < summary.minDurationMs) {
      summary.minDurationMs = result.durationMs;
    }

    if (summary.maxDurationMs === null || result.durationMs > summary.maxDurationMs) {
      summary.maxDurationMs = result.durationMs;
    }

    if (result.ok) {
      summary.successCount += 1;
      continue;
    }

    summary.failCount += 1;

    if (result.status === 0) {
      summary.networkErrorCount += 1;
      continue;
    }

    if (result.status === 404) {
      summary.notFoundCount += 1;
      continue;
    }

    if (result.status >= 500) {
      summary.serverErrorCount += 1;
      continue;
    }

    const message = String(result.body?.message || '');

    if (message.includes('이미 발급받은 쿠폰')) {
      summary.duplicateCount += 1;
    } else if (message.includes('모두 소진')) {
      summary.soldOutCount += 1;
    } else if (
      message.includes('발급 가능한 상태가 아닙니다') ||
      message.includes('비활성화된 쿠폰입니다') ||
      message.includes('발급 시작 전') ||
      message.includes('발급 기간이 종료')
    ) {
      summary.invalidStateCount += 1;
    } else {
      summary.unknownFailCount += 1;
    }
  }

  summary.avgDurationMs =
    results.length > 0 ? Number((totalDuration / results.length).toFixed(2)) : 0;

  return summary;
}

/**
 * 전체 동시 요청 실행
 * - 가장 강한 동시성 테스트 방식
 */
async function runFullConcurrency(userIds) {
  console.log('\n[실행 방식] 전체 동시 요청');
  const promises = userIds.map((userId) => issueCoupon(userId));
  return Promise.all(promises);
}

/**
 * 배치 단위 실행
 * - 서버가 너무 버거울 때 사용
 */
async function runInBatches(userIds, batchSize) {
  console.log(`\n[실행 방식] 배치 실행 (batchSize=${batchSize})`);

  const allResults = [];

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batchUserIds = userIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batchUserIds.map((userId) => issueCoupon(userId)),
    );

    allResults.push(...batchResults);

    console.log(
      `[진행] ${Math.min(i + batchSize, userIds.length)} / ${userIds.length}`,
    );
  }

  return allResults;
}

/**
 * 성공/실패 샘플 출력
 */
function printSamples(results) {
  const successSamples = results.filter((r) => r.ok).slice(0, 5);
  const failSamples = results.filter((r) => !r.ok).slice(0, 10);

  console.log('\n===== 성공 샘플 5건 =====');
  console.dir(successSamples, { depth: null });

  console.log('\n===== 실패 샘플 10건 =====');
  console.dir(failSamples, { depth: null });
}

/**
 * 메인 실행
 */
async function main() {
  console.log('======================================');
  console.log('쿠폰 발급 동시성 테스트 시작');
  console.log('======================================');
  console.log(`BASE_URL        : ${BASE_URL}`);
  console.log(`COUPON_ID       : ${COUPON_ID}`);
  console.log(`REQUEST_COUNT   : ${REQUEST_COUNT}`);
  console.log(`START_USER_ID   : ${START_USER_ID}`);
  console.log(`FULL_CONCURRENCY: ${FULL_CONCURRENCY}`);
  console.log(`BATCH_SIZE      : ${BATCH_SIZE}`);

  const userIds = Array.from(
    { length: REQUEST_COUNT },
    (_, index) => START_USER_ID + index,
  );

  console.log('\n[테스트 유저 범위]');
  console.log(`${userIds[0]} ~ ${userIds[userIds.length - 1]}`);

  const testStartedAt = Date.now();

  let results;
  if (FULL_CONCURRENCY) {
    results = await runFullConcurrency(userIds);
  } else {
    results = await runInBatches(userIds, BATCH_SIZE);
  }

  const totalElapsedMs = Date.now() - testStartedAt;
  const summary = summarizeResults(results);

  console.log('\n======================================');
  console.log('테스트 결과 요약');
  console.log('======================================');
  console.table(summary);

  console.log(`\n총 테스트 소요 시간: ${totalElapsedMs}ms`);

  printSamples(results);

  /**
   * 기대값 안내
   * 예:
   * - 쿠폰 수량 100
   * - 요청 150
   *
   * 기대:
   * - successCount = 100
   * - failCount = 50
   */
  console.log('\n======================================');
  console.log('확인 포인트');
  console.log('======================================');
  console.log('1) 성공 건수가 coupon.totalQuantity 와 정확히 일치하는지');
  console.log('2) 실패 건수가 초과 요청 수와 일치하는지');
  console.log('3) 서버 에러(500)가 없는지');
  console.log('4) 이후 DB에서 issuedCount 와 coupon_issues row 수가 같은지');
}

main().catch((error) => {
  console.error('\n[치명적 오류] 테스트 실행 실패');
  console.error(error);
  process.exit(1);
});