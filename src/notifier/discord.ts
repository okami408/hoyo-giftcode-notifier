import type { GameConfig } from "../types";

async function post(webhookUrl: string, content: string): Promise<void> {
	const res = await fetch(webhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ content }),
		signal: AbortSignal.timeout(10_000),
	});
	if (!res.ok) {
		throw new Error(`Discord webhook failed: HTTP ${res.status} ${await res.text()}`);
	}
}

/** 新しいギフトコードを通知 */
export async function sendCodeNotification(webhookUrl: string, game: GameConfig, newCodes: string[]): Promise<void> {
	const links = newCodes.map((code) => `・${game.giftUrlTemplate.replace("{code}", code)}`).join("\n");
	const message = [
		`マスター、${game.emoji}${game.name}の新しいギフトコードが${newCodes.length}件見つかりました 🎁`,
		"",
		links,
	].join("\n");
	await post(webhookUrl, message);
}

/** 取得失敗が続いている時の警告 */
export async function sendHealthWarning(webhookUrl: string, game: GameConfig, streak: number): Promise<void> {
	const urls = game.sources.map((s) => `・${s.url}`).join("\n");
	const message = [
		`⚠️ マスター、${game.name}のコードが${streak}回連続で取得できていません。`,
		"まとめサイトの構造変更やブロックの可能性があります。",
		"",
		urls,
	].join("\n");
	await post(webhookUrl, message);
}
