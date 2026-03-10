import {useEffect} from 'react';
import type {ReactNode} from 'react';
import {Text, Box} from 'ink';
import {z} from 'zod';
import {createApiClient} from '../../lib/api.js';
import {parseRelativeTime} from '../../lib/time.js';

const FlowSummarySchema = z.object({
	flowId: z.string(),
	source: z.string().nullish(),
	logCount: z.number(),
	firstSeen: z.number(),
	lastSeen: z.number(),
});

const FlowsResponseSchema = z.object({
	flows: z.array(FlowSummarySchema),
	pagination: z.object({
		total: z.number().optional(),
		offset: z.number(),
		limit: z.number(),
		hasMore: z.boolean(),
	}),
});

type FlowsFlags = {
	from: string;
	to?: string;
	source?: string;
	limit: number;
	offset: number;
};

type Props = {
	flags: FlowsFlags;
	token: string;
	onDone: (output: ReactNode, interactive: boolean) => void;
	onError: (message: string) => void;
};

function formatRelativeTime(timestamp: number): string {
	const diff = Date.now() - timestamp;
	const seconds = Math.floor(diff / 1000);
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

function getFlowName(flowId: string): string {
	const lastDash = flowId.lastIndexOf('-');
	return lastDash > 0 ? flowId.slice(0, lastDash) : flowId;
}

export default function FlowsView({flags, token, onDone, onError}: Props) {
	useEffect(() => {
		void run();
	}, []);

	async function run() {
		try {
			const client = createApiClient({token});
			const from = parseRelativeTime(flags.from);
			const to = flags.to ? parseRelativeTime(flags.to) : undefined;
			const raw = await client.get('/v1/flows', {
				from,
				to,
				source: flags.source,
				limit: flags.limit,
				offset: flags.offset > 0 ? flags.offset : undefined,
			});
			const data = FlowsResponseSchema.parse(raw);

			if (data.flows.length === 0) {
				onDone(<Text dimColor>No flows found</Text>, false);
				return;
			}

			const nameW = 24;
			const logsW = 6;
			const sourceW = 16;
			const timeW = 10;

			onDone(
				<Box flexDirection="column">
					<Text bold>Flows{data.pagination.total != null ? ` (${data.pagination.total} total)` : ''}</Text>
					<Text dimColor>{'NAME'.padEnd(nameW)}{'LOGS'.padEnd(logsW)}{'SOURCE'.padEnd(sourceW)}{'LAST SEEN'}</Text>
					{data.flows.map(flow => (
						<Text key={flow.flowId}>
							<Text>{getFlowName(flow.flowId).slice(0, nameW - 1).padEnd(nameW)}</Text>
							<Text color="cyan">{String(flow.logCount).padEnd(logsW)}</Text>
							<Text dimColor>{(flow.source ?? '-').slice(0, sourceW - 1).padEnd(sourceW)}</Text>
							<Text dimColor>{formatRelativeTime(flow.lastSeen).padEnd(timeW)}</Text>
						</Text>
					))}
					{data.pagination.hasMore ? (
						<Text dimColor>Use --offset {flags.offset + flags.limit} to see more</Text>
					) : null}
				</Box>,
				false,
			);
		} catch (err) {
			onError(err instanceof Error ? err.message : String(err));
		}
	}

	return null;
}
