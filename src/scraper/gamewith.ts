import type { ScrapingSource } from "../types";

/**
 * HTML文字列からコードを抽出する（テストしやすいように分離）
 * Workersにはcheerioが無いので、ページ全体に正規表現をかける
 * HTMLコメント内（画面に出ない古い記載など）は対象外にする
 */
export function extractCodes(html: string, pattern: RegExp): string[] {
	const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";
	const re = new RegExp(pattern.source, flags);
	const visible = html.replace(/<!--[\s\S]*?-->/g, "");
	const codes = new Set<string>();
	for (const m of visible.matchAll(re)) {
		if (m[1]) codes.add(m[1]);
	}
	return [...codes];
}

/** GameWithのページを取得してコードを返す */
export async function scrapeGameWithCodes(source: ScrapingSource): Promise<string[]> {
	const res = await fetch(source.url, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
			"Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
		},
		signal: AbortSignal.timeout(30_000),
	});
	if (!res.ok) {
		throw new Error(`HTTP ${res.status} ${res.statusText}`);
	}
	return extractCodes(await res.text(), source.codePattern);
}
