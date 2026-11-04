import type { GameConfig } from "../types";
import { starrailConfig } from "./starrail";
import { zenlessConfig } from "./zenless";

/**
 * 全ゲーム定義のレジストリ
 * 新しいゲームは src/games/<game>.ts を作ってここに追加する
 */
export const gameRegistry: GameConfig[] = [starrailConfig, zenlessConfig];
