import { Redis } from "@upstash/redis";

/**
 * Upstash Redisを使ったコードストア
 *
 * ゲームごとにRedisのSet型でコードを管理する。
 * キー形式: `notified:<gameId>` (例: `notified:starrail`)
 */

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
      );
    }

    redis = new Redis({ url, token });
  }
  return redis;
}

/** Redisキーを生成 */
function storeKey(gameId: string): string {
  return `notified:${gameId}`;
}

/**
 * 既知のコードをフィルタして新規コードのみを返す
 */
export async function filterNewCodes(
  gameId: string,
  codes: string[]
): Promise<string[]> {
  if (codes.length === 0) return [];

  const r = getRedis();
  const key = storeKey(gameId);

  // 各コードがSetに存在するか確認
  const checks = await Promise.all(
    codes.map(async (code) => {
      const exists = await r.sismember(key, code);
      return { code, exists: exists === 1 };
    })
  );

  return checks.filter((c) => !c.exists).map((c) => c.code);
}

/**
 * 通知済みコードをストアに追加
 */
export async function markAsNotified(
  gameId: string,
  codes: string[]
): Promise<void> {
  if (codes.length === 0) return;

  const r = getRedis();
  const key = storeKey(gameId);

  // SADD で一括追加
  await r.sadd<string>(key, ...codes as [string, ...string[]]);
}
