# 引き継ぎ：HoYoverse ギフトコード通知の Cloudflare Workers 移行

最終更新: 2026-11-05

## 背景
- 旧システム: このリポジトリの migrate-to-workers 以前の履歴（main の 346008d まで）（GitHub Actions + Upstash Redis + Discord Webhook）
- 2026-06-27 を最後に停止。原因は GitHub Actions の schedule が「60日間リポジトリに動きがない」ため自動無効化されたこと（コード自体は正常だった）
- 再発防止のため Cloudflare Workers（Cron Triggers）+ Workers KV に移行（2026-11-05 移行作業すべて完了）
- 注意: 旧DBは Firebase ではなく **Upstash Redis**（Set型、キー `notified:starrail` / `notified:zenless`）

## 現在の構成
- 実行: Cloudflare Workers `hoyo-code-notifier` の `scheduled` ハンドラ
- 公開URLなし（`workers_dev: false`）。ただし Cron 登録にはアカウントの workers.dev サブドメインが必要（`okamibase.workers.dev` 作成済み）
- Cron: `17 * * * *`（毎時17分、1時間おき）※旧システムは4時間おき
- ストア: Workers KV（binding `CODES`）
  - `notified:<gameId>:<code>` … 通知済みコード（値は通知日時）
  - `health:<gameId>:zeroStreak` … 取得0件の連続回数
- 通知: Discord Webhook（secret `DISCORD_WEBHOOK_URL`）
- 取得元: GameWith のまとめ記事を fetch → 正規表現で `?code=XXXX` を抽出（Workers に cheerio が無いため）。HTML コメント内は除外（原神の記事に古いコードがコメントで残っているため）
- 対象ゲーム: 崩壊：スターレイル（starrail）、ゼンレスゾーンゼロ（zenless）、原神（genshin）

### ファイル
- `src/index.ts` … エントリ。ゲームごとに 取得 → 0件監視 → 未通知判定 → 通知 → 保存
- `src/games/*.ts`, `src/games/registry.ts` … ゲーム設定。ゲーム追加はここに1ファイル足す
- `src/scraper/gamewith.ts` … `extractCodes()`（純粋関数）と `scrapeGameWithCodes()`
- `src/store/kv.ts` … KV の読み書き
- `src/notifier/discord.ts` … コード通知と死活監視の警告
- `test/index.spec.ts` … `extractCodes` のテスト（vitest、5件）

### 設計上の決まりごと
- Discord 通知に失敗したら KV に保存しない（次回リトライさせるため）
- 0件が `ZERO_STREAK_ALERT`（=24回、約1日）続いたら Discord に1回だけ警告
- KV への書き込みは値が変わる時だけ（無料枠の書き込み回数節約）
- 本番の Webhook URL はコード・リポジトリに書かない。ローカルは `.dev.vars`（gitignore済み）

## リポジトリについて
- 場所: `~/std/hoyo-giftcode-notifier`（GitHub: okami408/hoyo-giftcode-notifier）
- ブランチ `migrate-to-workers` で旧コードを削除し、Workers 版に置き換えた → PR #1 で main にマージ済み（2026-11-05）
- デプロイは Workers Builds による自動デプロイ（main への push で本番反映）
- 旧コードは main の履歴（346008d まで）に残っている
- 作業用に作った `~/hoyo-code-notifier` はここにコピー済み。動作確認できたら削除してよい

## 進捗
- [x] Cloudflare アカウント作成、`wrangler login`
- [x] プロジェクト作成（Hello World / Worker only / TypeScript）
- [x] KV namespace `CODES` 作成・wrangler.jsonc に追記
- [x] Cron 設定
- [x] secret `DISCORD_WEBHOOK_URL` 登録（このとき空の Worker が作成済み）
- [x] `.dev.vars` 作成
- [x] 旧ソースを Workers 向けに移植、`tsc --noEmit` 通過
- [x] ローカルで `wrangler dev --test-scheduled` 実行 → スタレ10件・ゼンゼロ5件取得、通知成功
- [x] 旧リポジトリに統合（ブランチ migrate-to-workers）
- [x] `npm install` → `npx vitest run`（3件パス）
- [x] コミット
- [x] Upstash → KV のデータ移行 → **スキップ**（Upstash DB がアーカイブ済みでアクセス不可。初回実行で掲載中コードがまとめて通知されるのを許容）
- [x] Cron を1時間おき（毎時17分）に変更
- [x] 本番デプロイ（2026-11-04、Version 36062680）
- [x] 本番の初回 Cron 実行を確認（2026-11-04 23:17 JST、スタレ10件・ゼンゼロ5件を通知。Cloudflare の IP からも GameWith 取得OK）
- [x] 原神を追加（ローカルで6件取得を確認）
- [x] 原神を本番デプロイ
- [x] 原神の初回通知を確認（2026-11-05 0:17 JST、6件）
- [x] main にマージ（PR #1）
- [x] Workers Builds で GitHub 連携（Production branch: main）
- [x] 自動デプロイの初回ビルド成功を確認（ea58e7e5）
- [x] 旧システムの停止・片付け
  - [x] 作業用コピー `~/hoyo-code-notifier` と移行スクリプトを削除
  - [x] GitHub の Secrets 削除、Upstash DB 完全削除（2026-11-04）

## 次にやること
移行作業は完了。運用中の注意:
- main への push ＝ 本番反映（Workers Builds）。試す変更は別ブランチで（別ブランチは preview 版のアップロードのみ）
- 取得できなくなると、0件が24回（約1日）続いた時点で Discord に警告が来る。来たら GameWith の記事 URL・HTML 構造の変化を確認する

**改善候補（任意）**
   - 取得元を2つにする（Game8 など）。`sources` に足せば結果は合算される
   - `fetch` ハンドラは現状メッセージを返すだけ

## 環境メモ
- Mac（macOS 27.2）、Node v22.14（Claude Code のシェルから見た版）、wrangler 4.157.0
- `gh`（GitHub CLI）は未インストール。GitHub 操作はブラウザで行う
- 手動で `npx wrangler deploy` する場合は、Claude Code の自動モードでブロックされるため、ユーザーが自分のターミナルで実行する
- Cron の登録にはアカウントの workers.dev サブドメインが必要（作成済み）
- ユーザーは手順を一つずつ確認しながら進めたい。各ステップでコマンドと意味を説明すること
