import type { GameConfig } from "../types";

export const genshinConfig: GameConfig = {
	id: "genshin",
	name: "原神",
	emoji: "🌬️✨",
	giftUrlTemplate: "https://genshin.hoyoverse.com/ja/gift?code={code}",
	sources: [
		{
			url: "https://gamewith.jp/genshin/article/show/231856",
			type: "gamewith",
			// 言語パス（/ja/ など）は省略や別言語でも拾えるようにする
			codePattern: /genshin\.hoyoverse\.com\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?gift\?code=([A-Za-z0-9]+)/,
		},
	],
};
