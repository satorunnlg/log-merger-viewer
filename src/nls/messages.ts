import * as nls from 'vscode-nls';

// デフォルトで日本語を使用
const localize = nls.config({ locale: 'ja' })();

/**
 * メッセージリソース定義
 */
export const Messages = {
	// コマンドとUI関連
	mergeLogs: localize('logMergerViewer.mergeAndView', 'ログファイルを時間順に結合して表示'),
	selectLogFiles: localize('logMergerViewer.selectFiles', '表示するログファイルを選択'),

	// ヘッダーとフッター
	headerTitle: localize('logMergerViewer.headerTitle', 'Log Merger Viewer - 結合ログファイル'),
	generatedAt: localize('logMergerViewer.generatedAt', '生成日時: {0}'),
	sourceFiles: localize('logMergerViewer.sourceFiles', '元ファイル:'),
	colorLegend: localize('logMergerViewer.colorLegend', 'ファイルの色対応:'),
	prefixLabel: localize('logMergerViewer.prefixLabel', '- プレフィックス: {0}'),

	// ギャップ表示
	timeGapLabel: localize('logMergerViewer.timeGapLabel', '{0}の間隔'),

	// エラーメッセージ
	errorOccurred: localize('logMergerViewer.error', 'エラーが発生しました: {0}'),
	unknownError: localize('logMergerViewer.unknownError', '不明なエラーが発生しました。'),
	parseError: localize('logMergerViewer.parseError', 'ファイル {0} の解析中にエラーが発生しました: {1}'),
	parseUnknownError: localize('logMergerViewer.parseUnknownError', 'ファイル {0} の解析中に不明なエラーが発生しました。'),
	highlightError: localize('logMergerViewer.highlightError', 'ハイライト表示中にエラーが発生しました。'),

	// ログメッセージ
	tempFileDeleted: localize('logMergerViewer.tempFileDeleted', '一時ファイルを削除しました: {0}'),
	tempFileDeleteFailed: localize('logMergerViewer.tempFileDeleteFailed', '一時ファイルの削除に失敗しました:'),
	cacheRemoved: localize('logMergerViewer.cacheRemoved', 'キャッシュから削除: {0}'),
	decorationApplied: localize('logMergerViewer.decorationApplied', 'ファイル {0} に {1} 行の装飾を適用しました (色: {2})'),

	// ステータスバー
	currentFileLine: localize('logMergerViewer.currentFileLine', '現在の行のファイル: {0}'),

	// 警告
	largeDecorationWarning: localize('logMergerViewer.largeDecorationWarning', '警告: {0} 行の装飾が適用されています。パフォーマンスに影響がある可能性があります。'),
	emptyPaletteWarning: localize('logMergerViewer.emptyPaletteWarning', 'カラーパレットが空です。デフォルトの色を使用します。'),

	// 時間フォーマット
	dayFormat: localize('logMergerViewer.dayFormat', '{0}日{1}時間{2}分{3}秒'),
	hourFormat: localize('logMergerViewer.hourFormat', '{0}時間{1}分{2}秒'),
	minuteFormat: localize('logMergerViewer.minuteFormat', '{0}分{1}秒'),
	secondFormat: localize('logMergerViewer.secondFormat', '{0}秒'),

	// ホバー情報
	fileInfoTitle: localize('logMergerViewer.fileInfoTitle', 'ファイル情報'),
	fileName: localize('logMergerViewer.fileName', 'ファイル名'),
	color: localize('logMergerViewer.color', '色'),
	entryCount: localize('logMergerViewer.entryCount', 'エントリ数'),
	entryUnit: localize('logMergerViewer.entryUnit', '行')
};