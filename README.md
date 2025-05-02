# Log Merger Viewer

VSCode用ログマージャービューア拡張機能 - 複数のログファイルを時間順に統合して表示

## 概要

「Log Merger Viewer」は、複数のログファイルを時間順に結合して1つのビューで表示できるVSCode拡張機能です。異なるシステムやアプリケーションから出力されたログを時系列で確認することで、問題の原因究明や開発・デバッグ作業を効率化します。

!スクリーンショット

## 主な機能

- 複数のログファイルを時間順に結合して表示
- ファイル別の色分け表示でソースの識別が容易
- 一定時間以上のイベントがない場合、区切り線と時間間隔を表示
- 大きなログファイルにも対応する最適化された表示
- ファイルツリーの右クリックメニューからの複数ファイル選択
- 一時ファイル名にタイムスタンプを含む

## インストール方法

### VSCodeマーケットプレイスから

1. VSCodeを起動
2. 拡張機能ビュー（Ctrl+Shift+X）を開く
3. 「Log Merger Viewer」を検索
4. 「インストール」ボタンをクリック

### VSIX手動インストール

1. [リリースページ](https://github.com/your-username/log-merger-viewer/releases)からVSIXファイルをダウンロード
2. VSCodeを起動
3. 拡張機能ビュー（Ctrl+Shift+X）を開く
4. 右上の「...」メニューから「VSIXからのインストール」を選択
5. ダウンロードしたVSIXファイルを選択

## 使用方法

### ログファイルの表示

1. エクスプローラーからログファイルを選択（複数選択可）
2. 右クリックして「ログファイルを時間順に結合して表示」を選択
   - または、フォルダを右クリックしてフォルダ内のログファイルから選択

### コマンドパレットからの起動

1. `Ctrl+Shift+P`でコマンドパレットを開く
2. 「ログファイルを時間順に結合して表示」を選択
3. ファイル選択ダイアログからログファイルを選択（複数選択可）

### 結合ファイルの操作

- カーソルを動かすと、同じファイルからのログエントリが強調表示されます
- ステータスバーに現在行のファイル名が表示されます
- 標準のVSCode検索機能（Ctrl+F）を使用できます
- 標準のVSCodeエディタ機能が使用可能（折りたたみ、行番号表示など）

## 設定項目

拡張機能の設定は以下の方法で変更できます：
1. `Ctrl+,`を押して設定を開く
2. 「拡張機能」タブを選択
3. 「Log Merger Viewer」を選択

### 主な設定項目

- `logMergerViewer.timeFormat`: ログの時刻フォーマット（momentフォーマット）
- `logMergerViewer.timeRegex`: ログから時刻を抽出する正規表現
- `logMergerViewer.colorPalette`: ファイル背景色パレット（通常テーマ用）
- `logMergerViewer.darkThemeColorPalette`: ファイル背景色パレット（ダークテーマ用）
- `logMergerViewer.showTimeGaps`: 時間間隔の表示（true/false）
- `logMergerViewer.timeGapThreshold`: 時間間隔を表示する閾値（秒）
- `logMergerViewer.showFilePrefix`: ファイルプレフィックスを表示（true/false）
- `logMergerViewer.filePrefixType`: プレフィックス形式（full/short/initial）
- `logMergerViewer.deleteTempFilesOnClose`: エディタ終了時に一時ファイル削除（true/false）

### カスタムログフォーマット対応

独自のログフォーマットに対応するには、以下の設定を変更します：

1. タイムスタンプ形式: `logMergerViewer.timeFormat` 
   例: `YYYY/MM/DD HH:mm:ss.SSS`

2. タイムスタンプ抽出用正規表現: `logMergerViewer.timeRegex`
   例: `(\\d{4}/\\d{2}/\\d{2}\\s\\d{2}:\\d{2}:\\d{2}\\.\\d{3})`

## トラブルシューティング

### よくある問題

1. **時刻が正しく認識されない**
   - `timeFormat`と`timeRegex`の設定がログファイルのフォーマットと一致しているか確認してください

2. **結合表示が表示されない**
   - ログファイルが正しく選択されていることを確認
   - ログファイル内に有効なタイムスタンプが含まれていることを確認

3. **エディタタブを切り替えるとハイライトが消える**
   - 拡張機能の更新を確認してください（v1.2.0以降で修正済み）

### 一時ファイルについて

デフォルトでは、エディタを閉じると一時ファイルは自動的に削除されます。一時ファイルを保持したい場合は、設定の`logMergerViewer.deleteTempFilesOnClose`を`false`に設定してください。

## 開発者情報

### ビルド手順

```bash
git clone https://github.com/satorunnlg/log-merger-viewer.git
cd log-merger-viewer
npm install
npm run compile
```

### パッケージング

```bash
npm install -g @vscode/vsce
vsce package
```

## ライセンス

MIT License - 詳細はLICENSEファイルを参照してください。