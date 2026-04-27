import axios from "axios";
import type { NotificationPayload } from "../types.js";

/**
 * Discord Webhookを使ってギフトコード通知を送信する
 */
export async function sendDiscordNotification(
  payload: NotificationPayload
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("DISCORD_WEBHOOK_URL must be set");
  }

  const { game, newCodes } = payload;

  // ギフトコードURLのリストを生成
  const codeLinks = newCodes
    .map((code) => {
      const url = game.giftUrlTemplate.replace("{code}", code);
      return `・${url}`;
    })
    .join("\n");

  const message = [
    `コードを取得しました`,
    `${game.emoji}${game.name}の新しいギフトコードが${newCodes.length}件見つかりました 🎁`,
    ``,
    codeLinks,
  ].join("\n");

  await axios.post(
    webhookUrl,
    { content: message },
    { timeout: 10_000 }
  );
}
