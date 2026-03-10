import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {getConfigDir} from './config.js';

const MAX_HISTORY = 500;

export function getHistoryPath(): string {
	return join(getConfigDir(), 'history.json');
}

export function loadHistory(): string[] {
	try {
		return JSON.parse(readFileSync(getHistoryPath(), 'utf-8')) as string[];
	} catch {
		return [];
	}
}

export function saveHistory(entries: string[]): void {
	const trimmed = entries.slice(-MAX_HISTORY);
	mkdirSync(getConfigDir(), {recursive: true, mode: 0o700});
	writeFileSync(getHistoryPath(), JSON.stringify(trimmed) + '\n', {mode: 0o600});
}
