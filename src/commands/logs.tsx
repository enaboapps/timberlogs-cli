import {Text} from 'ink';
import {useState, useEffect} from 'react';
import {z} from 'zod';
import {requireApiKey} from '../lib/auth.js';
import {createApiClient} from '../lib/api.js';
import {resolveApiUrl, parseRelativeTime} from '../lib/time.js';
import {handleError} from '../lib/errors.js';
import {isJsonMode, jsonOutput} from '../lib/output.js';
import type {LogsResponse} from '../types/log.js';
import LogTable from '../components/LogTable.js';

export const options = z.object({
	level: z.string().optional().describe('Filter by level (debug|info|warn|error)'),
	source: z.string().optional().describe('Filter by source'),
	env: z.string().optional().describe('Filter by environment'),
	search: z.string().optional().describe('Full-text search query'),
	from: z.string().default('1h').describe('Start time (e.g., 30m, 1h, 24h, 7d, ISO 8601)'),
	to: z.string().optional().describe('End time'),
	limit: z.number().default(50).describe('Max logs to return'),
	'user-id': z.string().optional().describe('Filter by user ID'),
	'session-id': z.string().optional().describe('Filter by session ID'),
	'flow-id': z.string().optional().describe('Filter by flow ID'),
	dataset: z.string().optional().describe('Filter by dataset'),
	json: z.boolean().default(false).describe('Output as JSON'),
	'api-key': z.string().optional().describe('Override API key'),
	'api-url': z.string().optional().describe('Override API URL'),
	verbose: z.boolean().default(false).describe('Show debug info'),
});

type Props = {
	options: z.infer<typeof options>;
};

export default function Logs({options: flags}: Props) {
	const [data, setData] = useState<LogsResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const json = isJsonMode(flags);

	useEffect(() => {
		void fetchLogs();
	}, []);

	async function fetchLogs() {
		try {
			const apiKey = requireApiKey({apiKey: flags['api-key']});
			const baseUrl = resolveApiUrl({apiUrl: flags['api-url']});
			const client = createApiClient({apiKey, baseUrl, verbose: flags.verbose});

			const from = parseRelativeTime(flags.from);
			const to = flags.to ? parseRelativeTime(flags.to) : undefined;

			const params: Record<string, string | number | undefined> = {
				level: flags.level,
				source: flags.source,
				environment: flags.env,
				from,
				to,
				limit: flags.limit,
				userId: flags['user-id'],
				sessionId: flags['session-id'],
				flowId: flags['flow-id'],
				dataset: flags.dataset,
			};

			let response: LogsResponse;

			if (flags.search) {
				response = await client.get<LogsResponse>('/v1/logs/search', {
					q: flags.search,
					...params,
				});
			} else {
				response = await client.get<LogsResponse>('/v1/logs', params);
			}

			if (json) {
				jsonOutput(response);
			}

			setData(response);
		} catch (err) {
			if (json) {
				handleError(err, true);
			}

			setError(err instanceof Error ? err.message : String(err));
		}
	}

	if (json) {
		return null;
	}

	if (error) {
		return <Text color="red">✗ {error}</Text>;
	}

	if (!data) {
		return <Text color="yellow">Fetching logs...</Text>;
	}

	const filters: string[] = [];
	if (flags.level) filters.push(`level=${flags.level}`);
	if (flags.source) filters.push(`source=${flags.source}`);
	if (flags.env) filters.push(`env=${flags.env}`);
	if (flags.search) filters.push(`search="${flags.search}"`);
	const filterSummary = filters.length > 0 ? `(${filters.join(', ')})` : undefined;

	return <LogTable logs={data.logs} pagination={data.pagination} filterSummary={filterSummary} />;
}
