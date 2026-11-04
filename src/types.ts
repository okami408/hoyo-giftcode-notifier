/** スクレイピング元の種別 */
export type ScraperType = "gamewith";

/** スクレイピング元の設定 */
export interface ScrapingSource {
	url: string;
	type: ScraperType;
	/** コード抽出用の正規表現（1番目のキャプチャがコード） */
	codePattern: RegExp;
}

/** ゲーム設定 */
export interface GameConfig {
	id: string;
	name: string;
	emoji: string;
	/** ギフトコード入力URL（{code}をコードで置換） */
	giftUrlTemplate: string;
	sources: ScrapingSource[];
}
