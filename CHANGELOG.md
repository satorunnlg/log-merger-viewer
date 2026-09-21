# 変更履歴

このファイルでは「Log Merger Viewer」拡張機能のすべての重要な変更を記録しています。

## [0.1.4] - 2026年9月21日

### セキュリティ
- Dependabot アラート対応（npm 推移的依存の脆弱性 14 件を `npm audit fix` で修正）
  - fast-uri: SSRF / ホスト混同 脆弱性修正 (HIGH、3.1.8 へ更新、GHSA-4c8g-83qw-93j6 ほか 5 件)
  - js-yaml: マージキー / !!omap 処理の二次的 CPU 消費 DoS 修正 (HIGH、4.3.2 へ更新、GHSA-2883-xcg3-v3hh ほか 2 件)
  - brace-expansion: 指数時間展開による DoS 修正 (HIGH、1.1.21 / 2.1.7 へ更新、GHSA-3jxr-9vmj-r5cp)
  - browserslist: 信頼できない browserslist-stats によるクラッシュ / prototype 書き込み修正 (HIGH、4.29.0 へ更新、GHSA-73wf-gq98-2v4g)
  - baseline-browser-mapping: 不正入力によるプロセス終了 DoS 修正 (MEDIUM、2.11.25 へ更新、GHSA-w5vr-8v7q-w6rv)
  - @humanfs/node: 再帰コピーが symlink を辿る問題を修正 (MEDIUM、0.16.8 へ更新、GHSA-p498-v437-472g)
- `npm audit` の検出脆弱性は 0 件。拡張機能本体のコード変更はなし

## [0.1.3] - 2026年6月23日

### セキュリティ
- Dependabot アラート対応（npm 推移的依存の脆弱性を `npm audit fix` で修正）
  - fast-uri: パストラバーサル / ホスト混同 脆弱性修正 (HIGH、3.1.2 へ更新)
  - flatted: parse() による Prototype Pollution 脆弱性修正 (HIGH、3.4.2 へ更新)
  - picomatch: メソッドインジェクション / ReDoS 脆弱性修正 (MEDIUM、2.3.2 へ更新)
  - serialize-javascript: CPU 枯渇による DoS 脆弱性修正 (MEDIUM、7.0.6 へ更新)
  - あわせて brace-expansion / js-yaml の脆弱性も解消
- `npm audit` の検出脆弱性は 0 件

## [0.1.2] - 2026年3月14日

### セキュリティ
- セキュリティ脆弱性の一括修正
  - serialize-javascript: RCE 脆弱性修正 (GHSA-5c6j-r48x-rmvq、overrides で ^7.0.3 に強制)
  - minimatch: 正規表現DoS (ReDoS) 脆弱性修正 (3件)
  - webpack: SSRF 脆弱性修正 (2件)
  - ajv ReDoS / diff DoS / flatted DoS 修正

## [0.1.1] - 2026年1月3日

### セキュリティ
- npm audit により3件の低重要度脆弱性を修正
  - @eslint/plugin-kit: 正規表現DoS (ReDoS) 脆弱性修正 (< 0.3.4)
  - brace-expansion: 正規表現DoS (ReDoS) 脆弱性修正 (1.0.0-1.1.11, 2.0.0-2.0.1)

### 改善
- 依存関係の整理
  - sinon と chai をproduction依存から開発依存へ正しく移動
  - package.json の依存関係構成を最適化

### 開発環境
- .gitignore に CLAUDE.md と DESIGN.md を追加
  - AI開発支援用ドキュメントをGit管理対象外に設定

## [0.1.0] - 2025年5月3日

### 機能追加
- 複数のログファイルを時間順に結合して表示
- ファイル別の色分け表示によるソース識別機能
- タイムスタンプに基づくログエントリの正確なソート
- 一定時間以上（設定可能）のイベント間隔がある場合の区切り線と時間ギャップ表示
- 行単位でのホバー情報表示（ソースファイル情報）
- ステータスバーでの現在行の情報表示

### テーマ対応
- ライト/ダークテーマに応じた色パレット自動切替
- カスタマイズ可能な背景色パレット（透明度対応）

### カスタマイズ
- タイムスタンプ形式のカスタマイズ（正規表現とフォーマット指定）
- ファイルプレフィックス表示オプション（フル表示/短縮名/イニシャル）
- 時間ギャップの閾値設定
- 一時ファイル管理設定（エディタ終了時の自動削除オプション）

### その他
- 日本語UI対応
- 大規模ログファイルのパフォーマンス最適化
- 柔軟な拡張機能設定

## [0.0.1] - 内部開発バージョン
- 初期開発バージョン