import {Text, Box} from 'ink';
import {useState, useEffect} from 'react';
import {z} from 'zod';
import {requireApiKey, resolveApiUrl} from '../../lib/auth.js';
import {createApiClient} from '../../lib/api.js';
import {parseRelativeTime} from '../../lib/time.js';
import {handleError} from '../../lib/errors.js';
import {isJsonMode, jsonOutput} from '../../lib/output.js';

const FlowSummarySchema = z.object({
	flowId: z.string(),
	source: z.string(),
	logCount: z.number(),
	firstSeen: z.number(),
	lastSeen: z.number(),
});

const FlowsResponseSchema = z.object({
	flows: z.array(FlowSummarySchema),
	pagination: z.object({
		total: z.number(),
		offset: z.number(),
		limit: z.number(),
		hasMore: z.boolean(),
	}),
});

type FlowSummary = z.infer<typeof FlowSummarySchema>;
type FlowsResponse = z.infer<typeof FlowsResponseSchema>;

export const options = z.object({
	from: z.string().default('24h').describe('Start time (e.g., 1h, 24h, 7d)'),
	to: z.string().optional().describe('End time'),
	source: z.string().optional().describe('Filter by source'),
	limit: z.number().default(20).describe('Max flows to return'),
	offset: z.number().default(0).describe('Number of flows to skip'),
	json: z.boolean().default(false).describe('Output as JSON'),
	'api-key': z.string().optional().describe('Override API key'),
	'api-url': z.string().optional().describe('Override API URL'),
	verbose: z.boolean().default(false).describe('Show debug info'),
});

type Props = {
	options: z.infer<typeof options>;
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

export default function FlowsList({options: flags}: Props) {
	const [data, setData] = useState<FlowsResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const json = isJsonMode(flags);

	useEffect(() => {
		void fetchFlows();
	}, []);

	async function fetchFlows() {
		try {
			const apiKey = requireApiKey({apiKey: flags['api-key']});
			const baseUrl = resolveApiUrl({apiUrl: flags['api-url']});
			const client = createApiClient({apiKey, baseUrl, verbose: flags.verbose});

			const from = parseRelativeTime(flags.from);
			const to = flags.to ? parseRelativeTime(flags.to) : undefined;

			const raw = await client.get('/v1/flows', {
				from,
				to,
				source: flags.source,
				limit: flags.limit,
				offset: flags.offset || undefined,
			});
			const response = FlowsResponseSchema.parse(raw);

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
		return <Text color="yellow">Fetching flows...</Text>;
	}

	if (data.flows.length === 0) {
		return <Text dimColor>No flows found</Text>;
	}

	const nameW = 24;
	const logsW = 6;
	const sourceW = 16;
	const timeW = 10;

	return (
		<Box flexDirection="column">
			<Text bold>
				Flows ({data.pagination.total} total)
			</Text>
			<Text dimColor>
				{'NAME'.padEnd(nameW)}{'LOGS'.padEnd(logsW)}{'SOURCE'.padEnd(sourceW)}{'LAST SEEN'.padEnd(timeW)}
			</Text>
			{data.flows.map((flow: FlowSummary) => (
				<Text key={flow.flowId}>
					<Text>{getFlowName(flow.flowId).slice(0, nameW - 1).padEnd(nameW)}</Text>
					<Text color="cyan">{String(flow.logCount).padEnd(logsW)}</Text>
					<Text dimColor>{(flow.source || '-').slice(0, sourceW - 1).padEnd(sourceW)}</Text>
					<Text dimColor>{formatRelativeTime(flow.lastSeen).padEnd(timeW)}</Text>
				</Text>
			))}
			{data.pagination.hasMore && (
				<Text dimColor>
					{'\n'}Use --offset {flags.offset + flags.limit} to see more
				</Text>
			)}
		</Box>
	);
}
