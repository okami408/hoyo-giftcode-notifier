import { gameRegistry } from "./games/registry";
import { scrapeGameWithCodes } from "./scraper/gamewith";
import { filterNewCodes, markAsNotified, updateZeroStreak } from "./store/kv";
import { sendCodeNotification, sendHealthWarning } from "./notifier/discord";
import type { GameConfig, ScrapingSource } from "./types";

/** この回数だけ連続で0件だったらDiscordに警告（1時間おきなら約1日） */
const ZERO_STREAK_ALERT = 24;

async function scrape(source: ScrapingSource): Promise<string[]> {
	switch (source.type) {
		case "gamewith":
			return scrapeGameWithCodes(source);
		default:
			console.warn(`Unknown scraper type: ${source.type}`);
			return [];
	}
}

async function processGame(game: GameConfig, env: Env): Promise<void> {
	console.log(`🎮 [${game.name}] コードをチェック中...`);

	const allCodes = new Set<string>();
	for (const source of game.sources) {
		try {
			const codes = await scrape(source);
			codes.forEach((c) => allCodes.add(c));
			console.log(`  📄 ${source.url} → ${codes.length}件`);
		} catch (error) {
			console.error(`  ❌ ${source.url} の取得に失敗:`, error);
		}
	}

	// 死活監視：0件が続いたら1回だけ警告
	const streak = await updateZeroStreak(env.CODES, game.id, allCodes.size);
	if (streak === ZERO_STREAK_ALERT) {
		await sendHealthWarning(env.DISCORD_WEBHOOK_URL, game, streak);
	}
	if (allCodes.size === 0) {
		console.log(`  ℹ️ コードが見つかりませんでした（連続${streak}回）`);
		return;
	}

	const newCodes = await filterNewCodes(env.CODES, game.id, [...allCodes]);
	if (newCodes.length === 0) {
		console.log(`  ✅ 新しいコードはありません（${allCodes.size}件は通知済み）`);
		return;
	}
	console.log(`  🆕 新しいコード: ${newCodes.join(", ")}`);

	// 通知に失敗したら保存しない（次回リトライ）
	await sendCodeNotification(env.DISCORD_WEBHOOK_URL, game, newCodes);
	await markAsNotified(env.CODES, game.id, newCodes);
	console.log(`  💾 ${newCodes.length}件を通知済みとして保存`);
}

export default {
	// ブラウザからアクセスされても何もしない
	async fetch(): Promise<Response> {
		return new Response("hoyo-code-notifier is running.");
	},

	// Cron Triggers から呼ばれる本体
	async scheduled(_controller, env, _ctx): Promise<void> {
		for (const game of gameRegistry) {
			try {
				await processGame(game, env);
			} catch (error) {
				console.error(`❌ [${game.name}] の処理中にエラー:`, error);
			}
		}
	},
} satisfies ExportedHandler<Env>;
