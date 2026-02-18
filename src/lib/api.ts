import {CliError, ErrorCode} from './errors.js';

export interface ApiClient {
	get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T>;
	post<T>(path: string, body: unknown): Promise<T>;
}

export function createApiClient(options: {
	apiKey: string;
	baseUrl: string;
	verbose?: boolean;
}): ApiClient {
	const {apiKey, baseUrl, verbose} = options;

	const headers: Record<string, string> = {
		Authorization: `Bearer ${apiKey}`,
		'Content-Type': 'application/json',
	};

	async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
		const url = new URL(path, baseUrl);

		const start = Date.now();
		let response: Response;

		try {
			response = await fetch(url, {
				method,
				headers,
				body: body !== undefined ? JSON.stringify(body) : undefined,
				signal: AbortSignal.timeout(30_000),
			});
		} catch (error) {
			if (error instanceof DOMException && error.name === 'TimeoutError') {
				throw new CliError(ErrorCode.NETWORK_ERROR, 'Request timed out after 30s');
			}

			if (error instanceof TypeError) {
				throw new CliError(ErrorCode.NETWORK_ERROR, `Network error: ${error.message}`);
			}

			throw error;
		}

		const elapsed = Date.now() - start;

		if (verbose) {
			console.error(`→ ${method} ${path} (${elapsed}ms) ${response.status}`);
		}

		if (!response.ok) {
			let message: string;
			try {
				const body = (await response.json()) as {error?: string; message?: string};
				message = body.message ?? body.error ?? response.statusText;
			} catch {
				message = response.statusText;
			}

			if (response.status === 401 || response.status === 403) {
				throw new CliError(ErrorCode.AUTH_INVALID, `Authentication failed: ${message}`);
			}

			if (response.status === 404) {
				throw new CliError(ErrorCode.NOT_FOUND, `Not found: ${message}`);
			}

			if (response.status === 429) {
				throw new CliError(ErrorCode.RATE_LIMITED, `Rate limited: ${message}`);
			}

			if (response.status >= 500) {
				throw new CliError(ErrorCode.NETWORK_ERROR, `Server error (${response.status}): ${message}`);
			}

			throw new CliError(ErrorCode.NETWORK_ERROR, `HTTP ${response.status}: ${message}`);
		}

		return (await response.json()) as T;
	}

	return {
		get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
			const url = new URL(path, baseUrl);
			if (params) {
				for (const [key, value] of Object.entries(params)) {
					if (value !== undefined) {
						url.searchParams.set(key, String(value));
					}
				}
			}

			return request<T>('GET', `${url.pathname}${url.search}`);
		},

		post<T>(path: string, body: unknown): Promise<T> {
			return request<T>('POST', path, body);
		},
	};
}
