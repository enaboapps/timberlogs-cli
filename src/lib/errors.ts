export const ErrorCode = {
	AUTH_REQUIRED: 'AUTH_REQUIRED',
	AUTH_INVALID: 'AUTH_INVALID',
	RATE_LIMITED: 'RATE_LIMITED',
	NOT_FOUND: 'NOT_FOUND',
	NETWORK_ERROR: 'NETWORK_ERROR',
	INVALID_INPUT: 'INVALID_INPUT',
	PLAN_LIMIT: 'PLAN_LIMIT',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

const EXIT_CODES: Record<ErrorCode, number> = {
	AUTH_REQUIRED: 2,
	AUTH_INVALID: 2,
	RATE_LIMITED: 1,
	NOT_FOUND: 1,
	NETWORK_ERROR: 1,
	INVALID_INPUT: 1,
	PLAN_LIMIT: 1,
};

export class CliError extends Error {
	code: ErrorCode;
	exitCode: number;

	constructor(code: ErrorCode, message: string) {
		super(message);
		this.name = 'CliError';
		this.code = code;
		this.exitCode = EXIT_CODES[code];
	}
}

export function formatError(error: CliError): {error: true; code: string; message: string} {
	return {error: true, code: error.code, message: error.message};
}

export function handleError(error: unknown, jsonMode: boolean): never {
	if (error instanceof CliError) {
		if (jsonMode) {
			console.log(JSON.stringify(formatError(error)));
		} else {
			console.error(`\x1b[31m✗ ${error.message}\x1b[0m`);
		}

		process.exit(error.exitCode);
	}

	const message = error instanceof Error ? error.message : String(error);

	if (jsonMode) {
		console.log(JSON.stringify({error: true, code: 'UNKNOWN', message}));
	} else {
		console.error(`\x1b[31m✗ ${message}\x1b[0m`);
	}

	process.exit(1);
}
