/**
 * Upstash Redis の通知済みコードを、Workers KV の bulk put 用JSONに書き出す
 *
 * 使い方:
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... node scripts/export-upstash.mjs
 *   npx wrangler kv bulk put kv-import.json --binding CODES --remote
 */
import { writeFileSync } from "node:fs";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
	console.error("UPSTASH_REDIS_REST_URL と UPSTASH_REDIS_REST_TOKEN を設定してください");
	process.exit(1);
}

const gameIds = ["starrail", "zenless"];
const entries = [];

for (const gameId of gameIds) {
	const res = await fetch(`${url}/smembers/notified:${gameId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok) throw new Error(`${gameId}: HTTP ${res.status} ${await res.text()}`);
	const { result } = await res.json();
	console.log(`${gameId}: ${result.length}件`);
	for (const code of result) {
		entries.push({ key: `notified:${gameId}:${code}`, value: "migrated-from-upstash" });
	}
}

writeFileSync("kv-import.json", JSON.stringify(entries, null, 2));
console.log(`kv-import.json に ${entries.length}件を書き出しました`);
