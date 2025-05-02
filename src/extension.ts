import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import moment from 'moment'; // デフォルトインポート
import { Messages } from './nls/messages';

// ログエントリの型定義
interface LogEntry {
	timestamp: number;
	time: string;
	content: string;
	file: string;
}

// ファイル情報の型定義
interface FileInfo {
	filename: string;
	color: string;
	entries: LogEntry[];
}

// デコレーションタイプのマップ
const fileDecorationTypes = new Map<string, vscode.TextEditorDecorationType>();
// ステータスバーアイテム
let statusBarItem: vscode.StatusBarItem;
// ファイルパスごとの行マッピング情報をキャッシュ
const fileLineMapCache = new Map<string, Map<number, { file: string, color: string }>>();

// 拡張機能のアクティベート時に呼ばれる関数
export function activate(context: vscode.ExtensionContext): void {
	console.log(Messages.mergeLogs);

	// ステータスバー項目を作成
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	context.subscriptions.push(statusBarItem);

	// ログファイルを結合して表示するコマンド
	let disposable = vscode.commands.registerCommand('log-merger-viewer.mergeAndView', async function () {
		try {
			// コマンドパレットからの呼び出し
			const result = await vscode.window.showOpenDialog({
				canSelectMany: true,
				filters: {
					'ログファイル': ['log', 'txt']
				},
				title: Messages.selectLogFiles
			});

			if (!result || result.length === 0) {
				return;
			}

			const fileUris = result;

			// ファイル選択結果をログ出力
			console.log(`選択されたファイル: ${fileUris.length}個`);
			fileUris.forEach(uri => console.log(` - ${uri.fsPath}`));

			// 設定から色パレットを取得
			const config = vscode.workspace.getConfiguration('logMergerViewer');
			const colorPalette = config.get<string[]>('colorPalette');

			if (!colorPalette || colorPalette.length === 0) {
				vscode.window.showErrorMessage('カラーパレットが設定されていません。');
				return;
			}

			// ファイル情報の配列を初期化
			const fileInfos: FileInfo[] = [];

			// すべてのログファイルを解析
			for (let i = 0; i < fileUris.length; i++) {
				const uri = fileUris[i];
				const filename = path.basename(uri.fsPath);
				const color = colorPalette[i % colorPalette.length];

				try {
					const entries = parseLogFile(uri.fsPath, filename);
					fileInfos.push({
						filename,
						color,
						entries
					});
				} catch (error) {
					if (error instanceof Error) {
						vscode.window.showErrorMessage(Messages.parseError.replace('{0}', filename).replace('{1}', error.message));
					} else {
						vscode.window.showErrorMessage(Messages.parseUnknownError.replace('{0}', filename));
					}
				}
			}

			// すべてのエントリを時間順にソート
			const allEntries: LogEntry[] = [];
			fileInfos.forEach(fileInfo => {
				allEntries.push(...fileInfo.entries);
			});

			allEntries.sort((a, b) => a.timestamp - b.timestamp);

			// タイムギャップを検出して特殊エントリを挿入 (設定に依存)
			const showTimeGaps = config.get<boolean>('showTimeGaps', true);
			const timeGapThreshold = (config.get<number>('timeGapThreshold') || 60) * 1000; // 秒からミリ秒に変換
			const entriesWithGaps: (LogEntry | { isGap: boolean, gapDuration: number, formattedGap: string })[] = [];

			for (let i = 0; i < allEntries.length; i++) {
				entriesWithGaps.push(allEntries[i]);

				if (showTimeGaps && i < allEntries.length - 1) {
					const timeDiff = allEntries[i + 1].timestamp - allEntries[i].timestamp;
					if (timeDiff > timeGapThreshold) {
						// 時間ギャップを挿入
						entriesWithGaps.push({
							isGap: true,
							gapDuration: timeDiff,
							formattedGap: formatDuration(timeDiff)
						});
					}
				}
			}

			// マージされたコンテンツを生成
			const { content: mergedContent, fileLineMap } = generateMergedContent(fileInfos, entriesWithGaps);

			// 現在の日時を含む一時ファイル名を生成
			const timestamp = moment().format('YYYYMMDD_HHmmss');
			const tempFilePath = path.join(os.tmpdir(), `logmerger_${timestamp}.log`);

			// 一時ファイルに書き込み
			fs.writeFileSync(tempFilePath, mergedContent);

			// 一時ファイルを開く際に行マッピング情報をキャッシュ
			const document = await vscode.workspace.openTextDocument(tempFilePath);
			const editor = await vscode.window.showTextDocument(document);

			// 行マッピング情報をキャッシュ
			fileLineMapCache.set(tempFilePath.toLowerCase(), fileLineMap);

			// 装飾を適用
			applyDecorations(editor, fileLineMap);

			// ツールチップホバー提供を設定
			setupHoverProvider(editor, fileLineMap, fileInfos);

			// ファイルがクローズされたときに一時ファイルを削除するイベントリスナーを設定
			const deleteTempFilesOnClose = config.get<boolean>('deleteTempFilesOnClose', true);

			const disposable = vscode.workspace.onDidCloseTextDocument((doc) => {
				try {
					const docPath = doc.uri.fsPath.toLowerCase();

					if (docPath.includes('logmerger_')) {
						// 一時ファイルを削除
						if (deleteTempFilesOnClose) {
							try {
								fs.unlinkSync(docPath);
								console.log(Messages.tempFileDeleted.replace('{0}', docPath));
							} catch (error) {
								console.error(`${Messages.tempFileDeleteFailed} `, error);
							}
						}

						// ステータスバー項目を非表示にする
						statusBarItem.hide();
						disposable.dispose();

						// キャッシュから行マッピング情報を削除
						const foundKey = Array.from(fileLineMapCache.keys()).find(
							key => key.toLowerCase() === docPath
						);

						if (foundKey) {
							console.log(Messages.cacheRemoved.replace('{0}', foundKey));
							fileLineMapCache.delete(foundKey);
						}

						// 装飾タイプを解放
						fileDecorationTypes.forEach(decorationType => {
							decorationType.dispose();
						});
						fileDecorationTypes.clear();
					}
				} catch (error) {
					console.error('ドキュメント終了処理中にエラーが発生しました:', error);
				}
			});

			context.subscriptions.push(disposable);

			// 選択行変更イベントリスナーの設定（カーソル位置の行のファイルを表示）
			const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(e => {
				if (e.textEditor === editor) {
					// カーソル位置の行を取得
					const currentLine = e.selections[0].active.line;
					const fileInfo = fileLineMap.get(currentLine);

					// ステータスバーにファイル情報を表示
					if (fileInfo) {
						// ファイル名をステータスバーに表示
						statusBarItem.text = `$(file) ${fileInfo.file}`;
						statusBarItem.tooltip = Messages.currentFileLine.replace('{0}', fileInfo.file);
						statusBarItem.show();
					} else {
						statusBarItem.hide();
					}
				}
			});

			// エディタがクローズされたときに選択変更イベントリスナーを削除
			context.subscriptions.push(
				vscode.workspace.onDidCloseTextDocument(doc => {
					if (doc.uri.fsPath === tempFilePath) {
						selectionChangeDisposable.dispose();
					}
				})
			);

		} catch (error) {
			if (error instanceof Error) {
				vscode.window.showErrorMessage(Messages.errorOccurred.replace('{0}', error.message));
			} else {
				vscode.window.showErrorMessage(Messages.unknownError);
			}
		}
	});

	context.subscriptions.push(disposable);

	// エディタ切り替え時に装飾を再適用するイベントリスナーを修正
	const activeEditorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			// パスを取得して小文字に変換
			const tempFilePath = editor.document.uri.fsPath.toLowerCase();

			// fileLineMapCacheからも小文字で検索
			const foundKey = Array.from(fileLineMapCache.keys()).find(
				key => key.toLowerCase() === tempFilePath
			);

			if (foundKey && tempFilePath.includes('logmerger_')) {
				// キャッシュから行マッピング情報を取得して装飾を再適用
				applyDecorations(editor, fileLineMapCache.get(foundKey)!);
			}
		}
	});

	context.subscriptions.push(activeEditorChangeDisposable);

	// 拡張機能が非アクティブ化されたときのクリーンアップ
	context.subscriptions.push({
		dispose: () => {
			// すべての装飾タイプを破棄
			fileDecorationTypes.forEach(decorationType => {
				decorationType.dispose();
			});
			fileDecorationTypes.clear();

			// ステータスバー項目を破棄
			statusBarItem.dispose();
		}
	});
}

// ツールチップホバープロバイダーを設定する関数
function setupHoverProvider(editor: vscode.TextEditor, fileLineMap: Map<number, { file: string, color: string }>, fileInfos: FileInfo[]): void {
	// ホバープロバイダーを登録
	const hoverDisposable = vscode.languages.registerHoverProvider({ language: 'plaintext' }, {
		provideHover(document, position, token) {
			// ホバー位置が現在のエディタのドキュメントであるか確認
			if (document === editor.document) {
				const lineNum = position.line;
				const fileInfo = fileLineMap.get(lineNum);

				if (fileInfo) {
					// ホバー時にファイル情報を表示
					const colorBlock = '■'; // 色のブロックを表示

					// ファイル情報のMarkdownを作成
					const markdownContent = new vscode.MarkdownString();
					markdownContent.appendMarkdown(`**${Messages.fileInfoTitle}**\n\n`);
					markdownContent.appendMarkdown(`- **${Messages.fileName}**: ${fileInfo.file}\n`);
					markdownContent.appendMarkdown(`- **${Messages.color}**: ${colorBlock} ${fileInfo.color}\n`);

					// 原ファイルのパスを取得して表示（可能であれば）
					const originalFile = fileInfos.find(f => f.filename === fileInfo.file);
					if (originalFile) {
						const entriesCount = originalFile.entries.length;
						markdownContent.appendMarkdown(`- **${Messages.entryCount}**: ${entriesCount} ${Messages.entryUnit}\n`);
					}

					return new vscode.Hover(markdownContent);
				}
			}

			return null;
		}
	});

	// エディタがクローズされたときにホバープロバイダーを解除
	vscode.workspace.onDidCloseTextDocument((doc) => {
		if (doc === editor.document) {
			hoverDisposable.dispose();
		}
	});
}

// 一時ファイルのコンテンツ生成と行マッピング構築用関数
function generateMergedContent(
	fileInfos: FileInfo[],
	entriesWithGaps: (LogEntry | { isGap: boolean, gapDuration: number, formattedGap: string })[]
): {
	content: string,
	fileLineMap: Map<number, { file: string, color: string }>
} {
	// 設定を取得
	const config = vscode.workspace.getConfiguration('logMergerViewer');
	const showFilePrefix = config.get<boolean>('showFilePrefix', true);
	const filePrefixType = config.get<string>('filePrefixType', 'short');

	// ファイル名のマッピングを生成（短縮名やイニシャル用）
	const filePrefixMap = new Map<string, string>();
	if (showFilePrefix) {
		fileInfos.forEach(fileInfo => {
			const filename = fileInfo.filename;
			let prefix: string;

			switch (filePrefixType) {
				case 'full':
					prefix = `[${filename}] `;
					break;
				case 'short':
					// 拡張子を除いた名前
					prefix = `[${filename.replace(/\.[^/.]+$/, "")}] `;
					break;
				case 'initial':
					// 頭文字のみ（例: api-server.log → [AS]）
					prefix = `[${filename.split(/[^a-zA-Z0-9]/).filter(p => p).map(p => p[0].toUpperCase()).join('')}] `;
					break;
				default:
					prefix = `[${filename}] `;
			}

			filePrefixMap.set(filename, prefix);
		});
	}

	let mergedContent = '';
	let lineNumber = 0;

	// ファイルの対応行を追跡するマップ
	const fileLineMap = new Map<number, { file: string, color: string }>();

	// ファイル情報ヘッダーを追加
	mergedContent += `# ${Messages.headerTitle}\n`;
	mergedContent += `# ${Messages.generatedAt.replace('{0}', moment().format('YYYY-MM-DD HH:mm:ss'))}\n`;
	mergedContent += `# ${Messages.sourceFiles}\n`;

	// 色の凡例を追加
	mergedContent += `#\n# ${Messages.colorLegend}\n`;
	// ヘッダー行の基準行数
	const headerBaseLineCount = 5;

	fileInfos.forEach((fileInfo, index) => {
		const filename = fileInfo.filename;
		const prefix = filePrefixMap.get(filename) || '';

		// 色のブロックと、使用されるプレフィックスを表示
		mergedContent += `# ■ ${filename} (${fileInfo.color}) ${showFilePrefix ? Messages.prefixLabel.replace('{0}', prefix) : ''}\n`;

		// ヘッダー行のカラーマッピングを追加（ファイルカラーと同じ色）
		fileLineMap.set(headerBaseLineCount + index, {
			file: filename,
			color: fileInfo.color
		});
	});

	mergedContent += '#\n';
	// 先頭のヘッダー行数を計算
	const headerLines = fileInfos.length + 6; // ヘッダー基本行数 + ファイル数

	// ログエントリとギャップを追加
	for (const entry of entriesWithGaps) {
		if ('isGap' in entry && entry.isGap) {
			// ギャップ行を追加
			mergedContent += `\n--- ${Messages.timeGapLabel.replace('{0}', entry.formattedGap)} ---\n\n`;
			lineNumber += 3; // ギャップ前後の空行を含む
		} else if ('content' in entry) {
			// ファイルプレフィックスを追加（設定されている場合）
			const prefix = showFilePrefix ? (filePrefixMap.get(entry.file) || '') : '';

			// 通常のログエントリ
			mergedContent += prefix + entry.content + '\n';

			// ファイルマッピングを追跡 - ヘッダー行数を考慮
			const fileInfo = fileInfos.find(f => f.filename === entry.file);
			if (fileInfo) {
				// ヘッダー行数 + 現在のコンテンツ行数
				const absoluteLineNumber = headerLines + lineNumber;
				fileLineMap.set(absoluteLineNumber, {
					file: entry.file,
					color: fileInfo.color
				});
			}

			lineNumber++;
		}
	}

	return { content: mergedContent, fileLineMap };
}

// 装飾を適用する関数
function applyDecorations(editor: vscode.TextEditor, fileLineMap: Map<number, { file: string, color: string }>): void {
	try {
		// テーマの種類を検出
		const isDarkTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark
			|| vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;

		// 設定から適切なカラーパレットを取得
		const config = vscode.workspace.getConfiguration('logMergerViewer');
		const colorPalette = isDarkTheme
			? config.get<string[]>('darkThemeColorPalette', [])
			: config.get<string[]>('colorPalette', []);

		// カラーパレットが空の場合にフォールバック
		if (!colorPalette || colorPalette.length === 0) {
			console.warn(Messages.emptyPaletteWarning);
		}

		// 既存の装飾をクリーンアップ
		clearDecorations();

		// ファイルごとに行をグループ化する効率的な方法
		const fileRanges = groupRangesByFile(fileLineMap, colorPalette);

		// 装飾を適用
		applyFileDecorations(editor, fileRanges);
	} catch (error) {
		console.error('装飾適用中にエラーが発生しました:', error);
		vscode.window.showErrorMessage('ハイライト表示中にエラーが発生しました。');
	}
}

// 既存の装飾をクリア
function clearDecorations(): void {
	fileDecorationTypes.forEach(decorationType => {
		decorationType.dispose();
	});
	fileDecorationTypes.clear();
}

// ファイルごとに行をグループ化
function groupRangesByFile(
	fileLineMap: Map<number, { file: string, color: string }>,
	colorPalette: string[]
): Map<string, { color: string, ranges: vscode.Range[] }> {
	const fileRanges = new Map<string, { color: string, ranges: vscode.Range[] }>();

	// 各行をファイルごとに分類
	fileLineMap.forEach((fileInfo, lineNum) => {
		const { file } = fileInfo;

		// ファイルのエントリがなければ初期化
		if (!fileRanges.has(file)) {
			fileRanges.set(file, { color: '', ranges: [] });
		}

		// テーマに基づいた色を選択
		const fileIndex = Array.from(fileRanges.keys()).indexOf(file);
		const color = colorPalette && colorPalette.length > 0
			? colorPalette[fileIndex % colorPalette.length]
			: fileInfo.color;

		// 行範囲を追加
		const range = new vscode.Range(
			new vscode.Position(lineNum, 0),
			new vscode.Position(lineNum, Number.MAX_SAFE_INTEGER)
		);

		const fileRange = fileRanges.get(file);
		if (fileRange) {
			fileRange.color = color;
			fileRange.ranges.push(range);
		}
	});

	return fileRanges;
}

// ファイル装飾を適用
function applyFileDecorations(
	editor: vscode.TextEditor,
	fileRanges: Map<string, { color: string, ranges: vscode.Range[] }>
): void {
	// メモリ使用量を監視するためのカウント
	let totalRanges = 0;

	// 各ファイルの装飾を適用
	fileRanges.forEach((fileRange, file) => {
		// 装飾タイプを作成
		const decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: fileRange.color,
			isWholeLine: true
		});

		// マップに保存
		fileDecorationTypes.set(file, decorationType);

		// エディタに装飾を適用
		editor.setDecorations(decorationType, fileRange.ranges);

		// デバッグ用にログ出力
		console.log(`ファイル ${file} に ${fileRange.ranges.length} 行の装飾を適用しました (色: ${fileRange.color})`);
		totalRanges += fileRange.ranges.length;
	});

	// 大量の装飾がある場合は警告（パフォーマンスへの影響を考慮）
	if (totalRanges > 10000) {
		console.warn(Messages.largeDecorationWarning.replace('{0}', String(totalRanges)));
	}
}

// ログファイルからエントリを解析する関数
function parseLogFile(filePath: string, filename: string): LogEntry[] {
	const content = fs.readFileSync(filePath, 'utf8');
	const lines = content.split(/\r?\n/);
	const config = vscode.workspace.getConfiguration('logMergerViewer');
	const timeFormat = config.get<string>('timeFormat');
	const timeRegexStr = config.get<string>('timeRegex');

	const entries: LogEntry[] = [];
	let currentEntry: LogEntry | null = null;

	// 設定から正規表現を取得
	const timeRegex = new RegExp(timeRegexStr || '(\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2}(?:,\\d{3})?)');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (!line.trim()) {
			continue;
		}

		const match = line.match(timeRegex);

		if (match) {
			// 新しいエントリを作成
			if (currentEntry) {
				entries.push(currentEntry);
			}

			const timestamp = moment(match[1], timeFormat);
			currentEntry = {
				timestamp: timestamp.valueOf(), // ミリ秒でのUNIXタイムスタンプ
				time: match[1],
				content: line,
				file: filename
			};
		} else if (currentEntry) {
			// 継続行を現在のエントリに追加
			currentEntry.content += '\n' + line;
		}
	}

	// 最後のエントリを追加
	if (currentEntry) {
		entries.push(currentEntry);
	}

	return entries;
}

// 時間間隔をフォーマットする関数
function formatDuration(milliseconds: number): string {
	const seconds = Math.floor(milliseconds / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) {
		return Messages.dayFormat
			.replace('{0}', String(days))
			.replace('{1}', String(hours % 24))
			.replace('{2}', String(minutes % 60))
			.replace('{3}', String(seconds % 60));
	} else if (hours > 0) {
		return Messages.hourFormat
			.replace('{0}', String(hours))
			.replace('{1}', String(minutes % 60))
			.replace('{2}', String(seconds % 60));
	} else if (minutes > 0) {
		return Messages.minuteFormat
			.replace('{0}', String(minutes))
			.replace('{1}', String(seconds % 60));
	} else {
		return Messages.secondFormat
			.replace('{0}', String(seconds));
	}
}

// デアクティベート時の処理
export function deactivate(): void {
	// リソースの解放
	fileDecorationTypes.forEach(decorationType => {
		decorationType.dispose();
	});
	fileDecorationTypes.clear();

	// fileLineMapCacheをクリア
	fileLineMapCache.clear();

	if (statusBarItem) {
		statusBarItem.dispose();
	}
}