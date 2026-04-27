import type { GameConfig } from "../types.js";
import { starrailConfig } from "./starrail.js";
import { zenlessConfig } from "./zenless.js";

/**
 * 全ゲーム定義のレジストリ
 *
 * 新しいゲームを追加する場合：
 * 1. src/games/<game>.ts にGameConfigを定義
 * 2. この配列にimportして追加
 */
export const gameRegistry: GameConfig[] = [starrailConfig, zenlessConfig];
