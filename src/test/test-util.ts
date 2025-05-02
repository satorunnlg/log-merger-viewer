/**
 * テスト用ユーティリティ
 * 実際のテストで使用する関数をここでエクスポートする
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * テスト用のログファイルを生成
 * @param directory 生成先ディレクトリ
 * @param fileCount 生成するファイル数
 * @param entriesPerFile 各ファイルのエントリ数
 * @param timeGap 時間のギャップ（秒）
 */
export function generateTestLogs(
	directory: string,
	fileCount: number = 3,
	entriesPerFile: number = 20,
	timeGap: number = 5
): string[] {
	// ディレクトリが存在しない場合は作成
	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory, { recursive: true });
	}

	const filePaths: string[] = [];
	const baseDate = new Date('2023-01-01T10:00:00Z');

	for (let f = 0; f < fileCount; f++) {
		const filePath = path.join(directory, `test-log-${f + 1}.log`);
		let content = '';

		for (let i = 0; i < entriesPerFile; i++) {
			// バラつきを持たせるためにファイルごとに時間をずらす
			const time = new Date(baseDate.getTime() +
				(f * 2000) + // ファイルごとのオフセット
				(i * timeGap * 1000)); // エントリ間の間隔

			const timeStr = time.toISOString()
				.replace('T', ' ')
				.replace('Z', '')
				.substring(0, 23)
				.replace('.', ',');

			// 様々なログレベルを含める
			const levels = ['INFO', 'DEBUG', 'WARN', 'ERROR'];
			const level = levels[Math.floor(Math.random() * levels.length)];

			content += `${timeStr} [${level}] File ${f + 1} - Log message ${i + 1}\n`;
		}

		fs.writeFileSync(filePath, content);
		filePaths.push(filePath);
	}

	return filePaths;
}

/**
 * 時間ギャップテスト用のログファイルを生成
 * @param directory 生成先ディレクトリ
 */
export function generateTimeGapLogs(directory: string): string[] {
	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory, { recursive: true });
	}

	const filePath = path.join(directory, 'time-gap.log');
	let content = '';

	// 通常のログ
	const baseDate = new Date('2023-01-01T10:00:00Z');
	for (let i = 0; i < 5; i++) {
		const time = new Date(baseDate.getTime() + (i * 10000)); // 10秒間隔
		const timeStr = formatTime(time);
		content += `${timeStr} [INFO] Normal log entry ${i + 1}\n`;
	}

	// 1分のギャップ
	const gapTime = new Date(baseDate.getTime() + 5 * 10000 + 60000); // 1分後
	const gapTimeStr = formatTime(gapTime);
	content += `${gapTimeStr} [WARN] This entry appears after a 1-minute gap\n`;

	// さらに5エントリ
	for (let i = 0; i < 5; i++) {
		const time = new Date(gapTime.getTime() + (i * 10000)); // 10秒間隔
		const timeStr = formatTime(time);
		content += `${timeStr} [INFO] Post-gap entry ${i + 1}\n`;
	}

	fs.writeFileSync(filePath, content);
	return [filePath];
}

/**
 * 日付フォーマット用ヘルパー
 */
function formatTime(date: Date): string {
	return date.toISOString()
		.replace('T', ' ')
		.replace('Z', '')
		.substring(0, 23)
		.replace('.', ',');
}