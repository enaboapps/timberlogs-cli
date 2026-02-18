import {readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';
import type {Config} from '../types/config.js';

export function getConfigDir(): string {
	return process.env['TIMBERLOGS_CONFIG_DIR'] ?? join(homedir(), '.config', 'timberlogs');
}

export function getConfigPath(): string {
	return join(getConfigDir(), 'config.json');
}

export function readConfig(): Config {
	const path = getConfigPath();
	try {
		const data = readFileSync(path, 'utf-8');
		return JSON.parse(data) as Config;
	} catch {
		return {};
	}
}

export function writeConfig(config: Config): void {
	const dir = getConfigDir();
	mkdirSync(dir, {recursive: true, mode: 0o700});
	writeFileSync(getConfigPath(), JSON.stringify(config, null, 2) + '\n', {mode: 0o600});
}

export function deleteConfig(): void {
	const path = getConfigPath();
	if (existsSync(path)) {
		unlinkSync(path);
	}
}

