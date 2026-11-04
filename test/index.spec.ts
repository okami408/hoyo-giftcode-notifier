import { describe, it, expect } from "vitest";
import { extractCodes } from "../src/scraper/gamewith";
import { starrailConfig } from "../src/games/starrail";
import { zenlessConfig } from "../src/games/zenless";

describe("extractCodes", () => {
	it("スタレのコードを重複なしで抜き出す", () => {
		const html = `
			<a href="https://hsr.hoyoverse.com/gift?code=ABC123">▶自動入力リンク</a>
			<a href="https://hsr.hoyoverse.com/gift?code=ABC123">▶自動入力リンク</a>
			<a href="https://hsr.hoyoverse.com/gift?code=XYZ789">▶自動入力リンク</a>
			<a href="https://example.com">関係ないリンク</a>`;
		expect(extractCodes(html, starrailConfig.sources[0].codePattern)).toEqual(["ABC123", "XYZ789"]);
	});

	it("ゼンゼロのコードを抜き出す", () => {
		const html = `<a href="https://zenless.hoyoverse.com/redemption/gift?code=ZZZ2026">▶</a>`;
		expect(extractCodes(html, zenlessConfig.sources[0].codePattern)).toEqual(["ZZZ2026"]);
	});

	it("コードが無ければ空配列", () => {
		expect(extractCodes("<p>no codes</p>", starrailConfig.sources[0].codePattern)).toEqual([]);
	});
});
