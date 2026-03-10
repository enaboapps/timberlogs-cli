import {useEffect} from 'react';
import type {ReactNode} from 'react';
import {createApiClient} from '../../lib/api.js';
import {parseRelativeTime} from '../../lib/time.js';
import {LogsResponseSchema} from '../../types/log.js';
import LogTable from '../LogTable.js';

type LogsFlags = {
	level?: 'debug' | 'info' | 'warn' | 'error';
	source?: string;
	env?: string;
	search?: string;
	from: string;
	to?: string;
	limit: number;
	offset: number;
	'user-id'?: string;
	'session-id'?: string;
	'flow-id'?: string;
	dataset?: string;
	verbose?: boolean;
};

type Props = {
	flags: LogsFlags;
	token: string;
	onBack: () => void;
	onDone: (output: ReactNode, interactive: boolean) => void;
	onError: (message: string) => void;
};

export default function LogsView({flags, token, onBack, onDone, onError}: Props) {
	useEffect(() => {
		void run();
	}, []);

	async function run() {
		try {
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
				raw = await client.get('/v1/logs/search', {q: flags.search, ...params});
			} else {
				raw = await client.get('/v1/logs', params);
			}

			const response = LogsResponseSchema.parse(raw);

			const filterParts: string[] = [];
			if (flags.level) filterParts.push(`level=${flags.level}`);
			if (flags.source) filterParts.push(`source=${flags.source}`);
			if (flags.env) filterParts.push(`env=${flags.env}`);
			if (flags.search) filterParts.push(`search="${flags.search}"`);
			const filterSummary = filterParts.length > 0 ? `(${filterParts.join(', ')})` : undefined;

			onDone(
				<LogTable
					logs={response.logs}
					pagination={response.pagination}
					filterSummary={filterSummary}
					onBack={onBack}
				/>,
				true,
			);
		} catch (err) {
			onError(err instanceof Error ? err.message : String(err));
		}
	}

	return null;
}
