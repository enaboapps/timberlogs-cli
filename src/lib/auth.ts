import {readConfig} from './config.js';
import {CliError, ErrorCode} from './errors.js';

export function resolveToken(): string | null {
	const config = readConfig();

	if (config.sessionToken) {
		return config.sessionToken;
	}

	return null;
}

export function requireToken(): string {
	const token = resolveToken();
	if (!token) {
		throw new CliError(
			ErrorCode.AUTH_REQUIRED,
			'Not authenticated. Run `timberlogs login` to get started.',
		);
	}

	return token;
}
