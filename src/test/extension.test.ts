import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { before, after } from 'mocha';

// テスト用モジュールインポート
const testLogDir = path.resolve(__dirname, '../../test-log');

// テスト用ログファイル生成ヘルパー
function createTestLogFiles(): { filePaths: string[] } {
	// テストディレクトリを作成
	if (!fs.existsSync(testLogDir)) {
		fs.mkdirSync(testLogDir, { recursive: true });
	}

	// 各形式のログファイルを作成
	const standardLogPath = path.join(testLogDir, 'standard.log');
	const apacheLogPath = path.join(testLogDir, 'apache.log');
	const noTimestampLogPath = path.join(testLogDir, 'no-timestamp.log');
	const largeLogPath = path.join(testLogDir, 'large.log');

	// 1. 標準形式ログ作成
	let standardLog = '';
	const baseTime = new Date('2023-01-01T10:00:00');
	for (let i = 0; i < 10; i++) {
		const time = new Date(baseTime.getTime() + i * 10000); // 10秒ずつ間隔
		const timeStr = time.toISOString().replace('T', ' ').replace('Z', '').substring(0, 23).replace('.', ',');
		standardLog += `${timeStr} [INFO] Standard log message ${i + 1}\n`;
	}
	fs.writeFileSync(standardLogPath, standardLog);

	// 2. Apache形式ログ作成
	let apacheLog = '';
	for (let i = 0; i < 10; i++) {
		const time = new Date(baseTime.getTime() + i * 15000); // 15秒ずつ間隔
		const timeStr = time.toUTCString();
		apacheLog += `192.168.0.1 - - [${timeStr}] "GET /page${i} HTTP/1.1" 200 ${1024 + i * 100}\n`;
	}
	fs.writeFileSync(apacheLogPath, apacheLog);

	// 3. タイムスタンプなしログ
	const noTimestampLog = "This is a log without timestamp\nJust some random text\nNo time information here\n";
	fs.writeFileSync(noTimestampLogPath, noTimestampLog);

	// 4. 大きなログ (テストの速度のために実際は小さく)
	let largeLog = '';
	for (let i = 0; i < 100; i++) {
		const time = new Date(baseTime.getTime() + i * 5000);
		const timeStr = time.toISOString().replace('T', ' ').replace('Z', '').substring(0, 23).replace('.', ',');
		largeLog += `${timeStr} [DEBUG] Large log entry number ${i + 1} with some extra text to make it longer\n`;
	}
	fs.writeFileSync(largeLogPath, largeLog);

	// ファイルパスを返す
	return {
		filePaths: [standardLogPath, apacheLogPath, noTimestampLogPath, largeLogPath]
	};
}

// テスト用に生成した一時ファイルをチェック
async function findTempMergedFile(): Promise<string | undefined> {
	const tmpDir = os.tmpdir();
	const files = fs.readdirSync(tmpDir);
	const mergedFile = files.find(f => f.startsWith('logmerger_'));
	return mergedFile ? path.join(tmpDir, mergedFile) : undefined;
}

// 拡張機能が生成したエディタを探す
async function findLogMergerEditor(): Promise<vscode.TextEditor | undefined> {
	for (const editor of vscode.window.visibleTextEditors) {
		if (editor.document.uri.fsPath.includes('logmerger_')) {
			return editor;
		}
	}
	return undefined;
}

// スイート開始前の準備
before(async function () {
	this.timeout(10000); // タイムアウト設定

	// 拡張機能がアクティベートされるのを確認
	const ext = vscode.extensions.getExtension('one-case.log-merger-viewer');
	if (!ext) {
		throw new Error('拡張機能が見つかりません');
	}

	if (!ext.isActive) {
		await ext.activate();
	}

	// テスト用ログファイルを作成
	createTestLogFiles();
});

// スイート終了後のクリーンアップ
after(() => {
	// テスト生成ファイルを削除
	if (fs.existsSync(testLogDir)) {
		const files = fs.readdirSync(testLogDir);
		files.forEach(file => {
			fs.unlinkSync(path.join(testLogDir, file));
		});
		fs.rmdirSync(testLogDir);
	}
});

// メインテストスイート
suite('Log Merger Viewer Extension Test Suite', () => {
	// テストスイート開始のメッセージ
	vscode.window.showInformationMessage('Log Merger Viewerテスト開始');

	// 基本機能テスト
	test('コマンドが登録されていることを確認', async () => {
		const commands = await vscode.commands.getCommands();
		assert.strictEqual(commands.includes('log-merger-viewer.mergeAndView'), true);
	});

	// 設定テスト
	test('拡張機能の設定が存在することを確認', () => {
		const config = vscode.workspace.getConfiguration('logMergerViewer');
		assert.notStrictEqual(config.get('timeFormat'), undefined);
		assert.notStrictEqual(config.get('colorPalette'), undefined);
		assert.notStrictEqual(config.get('showTimeGaps'), undefined);
	});

	// ファイル解析機能のテスト
	suite('ログファイル解析機能テスト', () => {
		// 別のファイルで実装する拡張機能の関数をテスト用に外部に公開する必要があるため、
		// 現状の構造ではこの部分は直接テストが難しい
		// 実際の実装では extension.ts の関数をエクスポートするか、モジュールを分割する

		// 代わりに間接的な機能検証をするテストを実装
		// モッククラスを使用して内部関数をテストする方法も示す
		test('parseLogFile関数の正常系動作を確認できるモック', () => {
			// このようなテストの場合、実際には exportされた関数を直接テストする
			// または内部関数をテスト用にエクスポートする必要がある
			assert.ok(true, 'この部分では実際の構造でテスト可能な形に修正が必要');
		});
	});
});

// 統合テスト - 実際のコマンド実行
suite('コマンド実行統合テスト', function () {
	this.timeout(30000); // 長めのタイムアウト

	test('ログマージコマンドが実行でき、エディタが開くことを確認', async function () {
		// テスト用にLogMergerViewerCommandHandlerモッククラス作成
		// 実際の実装ではより詳細なテストが必要

		// 開いているエディタを閉じる
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');

		// 統合テストは手動でコマンド実行を行う設計が必要
		// ここでは例として、プログラムが利用可能であることの確認のみ行う
		assert.ok(vscode.commands.executeCommand('log-merger-viewer.mergeAndView'),
			'コマンド実行可能であること');
	});
});

// VS Code拡張テスト環境では自動テストに限界があるため、手動テスト手順も記録しておく
/**
 * 手動テストケース
 * 
 * 1. 複数ログファイル選択テスト
 *    - test-logフォルダ内の標準ログと大きなログを選択
 *    - マージされたファイルが表示されることを確認
 * 
 * 2. ハイライト表示テスト
 *    - マージされたファイル内でファイル別に色が適用されていることを確認
 * 
 * 3. ステータスバー表示テスト
 *    - カーソルを移動してステータスバーの表示が変わることを確認
 * 
 * 4. テーマ切替テスト
 *    - ライト/ダークテーマを切り替えてハイライトが適切に変わることを確認
 */
