import {Text} from 'ink';
import {useState, useEffect} from 'react';
import {z} from 'zod';
import {requireToken} from '../lib/auth.js';
import {createApiClient} from '../lib/api.js';
import {parseRelativeTime} from '../lib/time.js';
import {handleError} from '../lib/errors.js';
import {isJsonMode, jsonOutput} from '../lib/output.js';
import {formatLogs, type OutputFormat} from '../lib/formatters.js';
import {LogsResponseSchema, type LogsResponse} from '../types/log.js';
import LogTable from '../components/LogTable.js';

export const options = z.object({
	level: z.enum(['debug', 'info', 'warn', 'error']).optional().describe('Filter by level (debug|info|warn|error)'),
	source: z.string().optional().describe('Filter by source'),
	env: z.string().optional().describe('Filter by environment'),
	search: z.string().optional().describe('Full-text search query'),
	from: z.string().default('1h').describe('Start time (e.g., 30m, 1h, 24h, 7d, ISO 8601)'),
	to: z.string().optional().describe('End time'),
	limit: z.number().int().min(1).default(50).describe('Max logs to return'),
	offset: z.number().int().min(0).default(0).describe('Number of logs to skip (for pagination)'),
	'user-id': z.string().optional().describe('Filter by user ID'),
	'session-id': z.string().optional().describe('Filter by session ID'),
	'flow-id': z.string().optional().describe('Filter by flow ID'),
	dataset: z.string().optional().describe('Filter by dataset'),
	format: z.enum(['json', 'jsonl', 'csv', 'text', 'syslog', 'obl']).optional().describe('Output format (json|jsonl|csv|text|syslog|obl)'),
	json: z.boolean().default(false).describe('Output as JSON'),
	verbose: z.boolean().default(false).describe('Show debug info'),
});

type Props = {
	options: z.infer<typeof options>;
};

export default function Logs({options: flags}: Props) {
	const [data, setData] = useState<LogsResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fmt = flags.format as OutputFormat | undefined;
	const json = !fmt && isJsonMode(flags);

	useEffect(() => {
		void fetchLogs();
	}, []);

	async function fetchLogs() {
		try {
			const token = requireToken();
			const client = createApiClient({token, verbose: flags.verbose});

			const from = parseRelativeTime(flags.from);
			const to = flags.to ? parseRelativeTime(flags.to) : undefined;

			const params: Record<string, string | number | undefined> = {
				level: flags.level,
				source: flags.source,
				environment: flags.env,
				from,
				to,
				limit: flags.limit,
				offset: flags.offset > 0 ? flags.offset : undefined,
				userId: flags['user-id'],
				sessionId: flags['session-id'],
				flowId: flags['flow-id'],
				dataset: flags.dataset,
			};

			let raw: unknown;

			if (flags.search) {
				raw = await client.get('/v1/logs/search', {
					q: flags.search,
					...params,
				});
			} else {
				raw = await client.get('/v1/logs', params);
			}

			const response = LogsResponseSchema.parse(raw);

			if (fmt) {
				console.log(formatLogs(response.logs, fmt));
				process.exit(0);
			}

			if (json) {
				jsonOutput(response);
			}

			setData(response);
		} catch (err) {
			if (fmt || json) {
				handleError(err, true);
			}

			setError(err instanceof Error ? err.message : String(err));
		}
	}

	if (json || fmt) {
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
