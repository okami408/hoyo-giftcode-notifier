/**
 * 共通型定義
 * ゲームごとの設定やスクレイピング元を抽象化する
 */

/** スクレイピング元の種別 */
export type ScraperType = "gamewith";

/** スクレイピング元の設定 */
export interface ScrapingSource {
  /** スクレイピング対象URL */
  url: string;
  /** スクレイパーの種別 */
  type: ScraperType;
  /** コード抽出用の正規表現パターン（href属性に対して適用） */
  codePattern: RegExp;
}

/** ゲーム設定 */
export interface GameConfig {
  /** ゲーム識別子（例: "starrail"） */
  id: string;
  /** ゲーム表示名（例: "崩壊：スターレイル"） */
  name: string;
  /** Discord通知用の絵文字 */
  emoji: string;
  /** ギフトコード入力URL（{code}をコードで置換） */
  giftUrlTemplate: string;
  /** スクレイピング元一覧 */
  sources: ScrapingSource[];
}

/** スクレイピング結果 */
export interface ScrapeResult {
  gameId: string;
  codes: string[];
}

/** 通知対象 */
export interface NotificationPayload {
  game: GameConfig;
  newCodes: string[];
}
