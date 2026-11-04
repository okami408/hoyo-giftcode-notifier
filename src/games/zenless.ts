import type { GameConfig } from "../types";

export const zenlessConfig: GameConfig = {
	id: "zenless",
	name: "ゼンレスゾーンゼロ",
	emoji: "📺⚡",
	giftUrlTemplate: "https://zenless.hoyoverse.com/redemption/gift?code={code}",
	sources: [
		{
			url: "https://gamewith.jp/zenless/452252",
			type: "gamewith",
			codePattern: /zenless\.hoyoverse\.com\/redemption\/gift\?code=([A-Za-z0-9]+)/,
		},
	],
};
