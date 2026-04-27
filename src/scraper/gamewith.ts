import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapingSource } from "../types.js";

/**
 * GameWithページからギフトコードをスクレイピングする
 *
 * ページ内の<a>タグのhref属性から、codePatternに一致するコードを抽出する。
 * GameWithではギフトコードが `▶自動入力リンク` というテキスト付きの
 * <a>タグとして配置されており、hrefに `?code=XXXXX` が含まれる。
 */
export async function scrapeGameWithCodes(
  source: ScrapingSource
): Promise<string[]> {
  const response = await axios.get<string>(source.url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    },
    timeout: 30_000,
  });

  const $ = cheerio.load(response.data);
  const codes = new Set<string>();

  // ページ内の全リンクからコードパターンにマッチするものを抽出
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const match = href.match(source.codePattern);
    if (match?.[1]) {
      codes.add(match[1]);
    }
  });

  return [...codes];
}
