import { gameRegistry } from "./games/registry.js";
import { scrapeGameWithCodes } from "./scraper/gamewith.js";
import { filterNewCodes, markAsNotified } from "./store/upstash.js";
import { sendDiscordNotification } from "./notifier/discord.js";
import type { GameConfig, ScrapingSource } from "./types.js";

/**
 * 必須環境変数の起動時バリデーション
 */
function validateEnv(): void {
  const required = [
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "DISCORD_WEBHOOK_URL",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`必須環境変数が未設定です: ${missing.join(", ")}`);
  }
}

/**
 * スクレイパーの種別に応じたスクレイピング関数を呼び出す
 */
async function scrape(source: ScrapingSource): Promise<string[]> {
  switch (source.type) {
    case "gamewith":
      return scrapeGameWithCodes(source);
    default:
      console.warn(`Unknown scraper type: ${source.type}`);
      return [];
  }
}

/**
 * 1つのゲームのギフトコードをチェック → 通知するフロー
 */
async function processGame(game: GameConfig): Promise<void> {
  console.log(`\n🎮 [${game.name}] コードをチェック中...`);

  // 全ソースからコードを取得
  const allCodes = new Set<string>();
  for (const source of game.sources) {
    try {
      const codes = await scrape(source);
      codes.forEach((code) => allCodes.add(code));
      console.log(`  📄 ${source.url} → ${codes.length}件のコードを検出`);
    } catch (error) {
      console.error(`  ❌ ${source.url} のスクレイピングに失敗:`, error);
    }
  }

  if (allCodes.size === 0) {
    console.log(`  ℹ️  コードが見つかりませんでした`);
    return;
  }

  // 新規コードのフィルタリング
  const newCodes = await filterNewCodes(game.id, [...allCodes]);

  if (newCodes.length === 0) {
    console.log(`  ✅ 新しいコードはありません（${allCodes.size}件は通知済み）`);
    return;
  }

  console.log(`  🆕 新しいコード: ${newCodes.length}件`);
  newCodes.forEach((code) => console.log(`     → ${code}`));

  // Discord通知
  try {
    await sendDiscordNotification({ game, newCodes });
    console.log(`  📨 Discord通知を送信しました`);
  } catch (error) {
    console.error(`  ❌ Discord通知の送信に失敗:`, error);
    // 通知に失敗した場合はストアに保存しない（次回リトライさせる）
    return;
  }

  // 通知済みコードをストアに保存
  await markAsNotified(game.id, newCodes);
  console.log(`  💾 ${newCodes.length}件のコードを通知済みとして保存しました`);
}

/**
 * メインエントリーポイント
 */
async function main(): Promise<void> {
  validateEnv();
  console.log("🔍 HoYoverse ギフトコード通知システムを開始します");
  console.log(`📋 登録ゲーム数: ${gameRegistry.length}`);

  for (const game of gameRegistry) {
    try {
      await processGame(game);
    } catch (error) {
      console.error(`❌ [${game.name}] の処理中にエラーが発生:`, error);
    }
  }

  console.log("\n✨ 全ゲームの処理が完了しました");
}

main().catch((error) => {
  console.error("致命的なエラー:", error);
  process.exit(1);
});
