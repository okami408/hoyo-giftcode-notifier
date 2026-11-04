/**
 * Workers KV を使った通知済みコードのストア
 * キー形式: notified:<gameId>:<code>  （値は通知日時）
 */
const codeKey = (gameId: string, code: string) => `notified:${gameId}:${code}`;

/** 未通知のコードだけを返す */
export async function filterNewCodes(kv: KVNamespace, gameId: string, codes: string[]): Promise<string[]> {
	const results = await Promise.all(codes.map((code) => kv.get(codeKey(gameId, code))));
	return codes.filter((_, i) => results[i] === null);
}

/** 通知済みとして保存 */
export async function markAsNotified(kv: KVNamespace, gameId: string, codes: string[]): Promise<void> {
	const now = new Date().toISOString();
	await Promise.all(codes.map((code) => kv.put(codeKey(gameId, code), now)));
}

/**
 * 取得件数0の連続回数を記録する（静かに死ぬのを防ぐため）
 * 戻り値は更新後の連続回数。書き込みは値が変わる時だけにする
 */
export async function updateZeroStreak(kv: KVNamespace, gameId: string, found: number): Promise<number> {
	const key = `health:${gameId}:zeroStreak`;
	const prev = Number((await kv.get(key)) ?? "0");
	const next = found === 0 ? prev + 1 : 0;
	if (next !== prev) await kv.put(key, String(next));
	return next;
}
