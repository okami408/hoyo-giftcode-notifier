# hoyo-code-notifier

HoYoverse 系ゲームのギフトコードをまとめサイトから取得し、Discord に通知する Cloudflare Worker。

- 現在の状況と次の作業: @HANDOFF.md
- Cloudflare Workers の書き方: @AGENTS.md

## コマンド
- 型チェック: `npx tsc --noEmit`
- テスト: `npx vitest run`
- ローカル実行: `npx wrangler dev --test-scheduled` → `curl "http://localhost:8787/__scheduled?cron=17+*+*+*+*"`
- 型の再生成（wrangler.jsonc や secret を変えた後）: `npx wrangler types`
- デプロイ: `npx wrangler deploy`

## ルール
- 回答は日本語で
- Webhook URL などの秘密情報をコード・コミットに含めない
- `--remote` 付きの KV 操作やデプロイなど、本番に触れる操作は実行前に確認を取る
