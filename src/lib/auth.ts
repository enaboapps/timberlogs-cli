import {readConfig} from './config.js';
import {CliError, ErrorCode} from './errors.js';

export function resolveApiKey(flags: {apiKey?: string}): string | null {
	if (flags.apiKey) {
		return flags.apiKey;
	}

	const envKey = process.env['TIMBER_API_KEY'];
	if (envKey) {
		return envKey;
	}

	const config = readConfig();
	if (config.apiKey) {
		return config.apiKey;
	}

	return null;
}

export function requireApiKey(flags: {apiKey?: string}): string {
	const key = resolveApiKey(flags);
	if (!key) {
		throw new CliError(
			ErrorCode.AUTH_REQUIRED,
			'No API key found. Run `timberlogs login` or pass --api-key.',
		);
	}

	return key;
}

export function maskApiKey(key: string): string {
	if (key.length < 16) {
		return '****';
	}

	return key.slice(0, 8) + '****...' + key.slice(-4);
}
