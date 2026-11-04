# 引き継ぎ：HoYoverse ギフトコード通知の Cloudflare Workers 移行

最終更新: 2026-11-04

## 背景
- 旧システム: このリポジトリの migrate-to-workers 以前の履歴（main の 346008d まで）（GitHub Actions + Upstash Redis + Discord Webhook）
- 2026-06-27 を最後に停止。原因は GitHub Actions の schedule が「60日間リポジトリに動きがない」ため自動無効化されたこと（コード自体は正常だった）
- 再発防止のため Cloudflare Workers（Cron Triggers）+ Workers KV に移行中
- 注意: 旧DBは Firebase ではなく **Upstash Redis**（Set型、キー `notified:starrail` / `notified:zenless`）

## 現在の構成
- 実行: Cloudflare Workers `hoyo-code-notifier` の `scheduled` ハンドラ
- Cron: `0 */3 * * *`（3時間おき、UTC基準）※旧システムは4時間おき
- ストア: Workers KV（binding `CODES`）
  - `notified:<gameId>:<code>` … 通知済みコード（値は通知日時 or `migrated-from-upstash`）
  - `health:<gameId>:zeroStreak` … 取得0件の連続回数
- 通知: Discord Webhook（secret `DISCORD_WEBHOOK_URL`）
- 取得元: GameWith のまとめ記事を fetch → 正規表現で `?code=XXXX` を抽出（Workers に cheerio が無いため）
- 対象ゲーム: 崩壊：スターレイル（starrail）、ゼンレスゾーンゼロ（zenless）

### ファイル
- `src/index.ts` … エントリ。ゲームごとに 取得 → 0件監視 → 未通知判定 → 通知 → 保存
- `src/games/*.ts`, `src/games/registry.ts` … ゲーム設定。ゲーム追加はここに1ファイル足す
- `src/scraper/gamewith.ts` … `extractCodes()`（純粋関数）と `scrapeGameWithCodes()`
- `src/store/kv.ts` … KV の読み書き
- `src/notifier/discord.ts` … コード通知と死活監視の警告
- `test/index.spec.ts` … `extractCodes` のテスト（vitest）
- `scripts/export-upstash.mjs` … Upstash → KV bulk put 用 JSON（`kv-import.json`）を書き出す

### 設計上の決まりごと
- Discord 通知に失敗したら KV に保存しない（次回リトライさせるため）
- 0件が `ZERO_STREAK_ALERT`（=8回、約1日）続いたら Discord に1回だけ警告
- KV への書き込みは値が変わる時だけ（無料枠の書き込み回数節約）
- 本番の Webhook URL はコード・リポジトリに書かない。ローカルは `.dev.vars`（gitignore済み）

## リポジトリについて
- 場所: `~/std/hoyo-giftcode-notifier`（GitHub: okami408/hoyo-giftcode-notifier）
- ブランチ `migrate-to-workers` で旧コードを削除し、Workers 版に置き換えた（**未コミット**）
- 旧コードは main の履歴（346008d まで）に残っている
- 作業用に作った `~/hoyo-code-notifier` はここにコピー済み。動作確認できたら削除してよい
- `node_modules` は削除済み。Mac で `npm install` が必要

## 進捗
- [x] Cloudflare アカウント作成、`wrangler login`
- [x] プロジェクト作成（Hello World / Worker only / TypeScript）
- [x] KV namespace `CODES` 作成・wrangler.jsonc に追記
- [x] Cron 設定
- [x] secret `DISCORD_WEBHOOK_URL` 登録（このとき空の Worker が作成済み）
- [x] `.dev.vars` 作成
- [x] 旧ソースを Workers 向けに移植、`tsc --noEmit` 通過
- [x] ローカルで `wrangler dev --test-scheduled` 実行 → スタレ10件・ゼンゼロ5件取得、通知成功
- [x] 旧リポジトリに統合（ブランチ migrate-to-workers、未コミット）
- [x] `npm install` → `npx vitest run`（3件パス）
- [ ] コミット
- [ ] Upstash → KV のデータ移行
- [ ] 本番デプロイと動作確認
- [ ] 旧システムの停止・片付け

## 次にやること
1. **Upstash のデータ移行**
   - 無料DBは30日以上使われないとアーカイブされる。6月以降止まっているので、アーカイブ済みの可能性が高い
   - Upstash コンソールでDBの有無を確認 → アーカイブ済みなら新しいDBを作ってバックアップを復元
   - `UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... node scripts/export-upstash.mjs`
   - `npx wrangler kv bulk put kv-import.json --binding CODES --remote`
   - バックアップが無い場合は、初回実行で現在掲載中のコードがまとめて通知されるだけ（致命的ではない）
2. **本番デプロイ**
   - `npx wrangler deploy`
   - ダッシュボードの Workers → hoyo-code-notifier → Logs で次の Cron 実行を確認
   - **未確認事項**: ローカルの取得は自宅回線からのアクセスだった。Cloudflare の IP から GameWith が取れるかはデプロイ後のログで要確認（403 等なら取得元の見直しが必要）
3. **旧システムの停止**
   - GitHub の Actions で「Check Gift Codes」は無効のままにする（ワークフローファイルは削除済みなので、main にマージすれば消える）
   - GitHub の Secrets（UPSTASH_*、DISCORD_WEBHOOK_URL）は不要になったら削除
   - KV 移行が済んだら Upstash のDBを削除
4. **改善候補（任意）**
   - 取得元を2つにする（Game8 など）。`sources` に足せば結果は合算される
   - 原神を追加するか検討（ユーザーに確認）
   - `fetch` ハンドラは現状メッセージを返すだけ

## 環境メモ
- Mac（macOS 27.2）、Node v24.22.2（nodenv）、wrangler 4.157.0
- ユーザーは手順を一つずつ確認しながら進めたい。各ステップでコマンドと意味を説明すること
