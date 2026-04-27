import type { GameConfig } from "../types.js";

/**
 * 崩壊：スターレイル のゲーム設定
 */
export const starrailConfig: GameConfig = {
  id: "starrail",
  name: "崩壊：スターレイル",
  emoji: "🚂✨",
  giftUrlTemplate: "https://hsr.hoyoverse.com/gift?code={code}",
  sources: [
    {
      url: "https://gamewith.jp/houkaistarrail/article/show/396232",
      type: "gamewith",
      codePattern: /hsr\.hoyoverse\.com\/gift\?code=([A-Za-z0-9]+)/,
    },
  ],
};
