import {Text} from 'ink';
import {useState, useEffect} from 'react';
import {z} from 'zod';
import {requireApiKey, resolveApiUrl} from '../../lib/auth.js';
import {createApiClient} from '../../lib/api.js';
import {handleError} from '../../lib/errors.js';
import {isJsonMode, jsonOutput} from '../../lib/output.js';
import {LogsResponseSchema, type LogsResponse} from '../../types/log.js';
import FlowTimeline from '../../components/FlowTimeline.js';

export const args = z.tuple([z.string().describe('flowId')]);

export const options = z.object({
	json: z.boolean().default(false).describe('Output as JSON'),
	'api-key': z.string().optional().describe('Override API key'),
	'api-url': z.string().optional().describe('Override API URL'),
	verbose: z.boolean().default(false).describe('Show debug info'),
});

type Props = {
	args: z.infer<typeof args>;
	options: z.infer<typeof options>;
};

type FlowData = {
	flowId: string;
	logs: LogsResponse['logs'];
	stepCount: number;
	durationMs: number;
	hasErrors: boolean;
};

export default function FlowsShow({args: [flowId], options: flags}: Props) {
	const [data, setData] = useState<FlowData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const json = isJsonMode(flags);

	useEffect(() => {
		void fetchFlow();
	}, []);

	async function fetchFlow() {
		try {
			const apiKey = requireApiKey({apiKey: flags['api-key']});
			const baseUrl = resolveApiUrl({apiUrl: flags['api-url']});
			const client = createApiClient({apiKey, baseUrl, verbose: flags.verbose});

			const raw = await client.get('/v1/logs', {
				flowId,
				limit: 1000,
			});
			const response = LogsResponseSchema.parse(raw);

			const logs = response.logs;
			const stepCount = logs.length;
			const durationMs = logs.length > 1
				? new Date(logs[logs.length - 1]!.timestamp).getTime() - new Date(logs[0]!.timestamp).getTime()
				: 0;
			const hasErrors = logs.some(l => l.level === 'error');

			const flowData: FlowData = {flowId, logs, stepCount, durationMs, hasErrors};

			if (json) {
				jsonOutput(flowData);
			}

			setData(flowData);
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
		return <Text color="yellow">Fetching flow {flowId}...</Text>;
	}

	if (data.logs.length === 0) {
		return <Text dimColor>No logs found for flow {flowId}</Text>;
	}

	return (
		<FlowTimeline
			flowId={data.flowId}
			logs={data.logs}
			stepCount={data.stepCount}
			durationMs={data.durationMs}
			hasErrors={data.hasErrors}
		/>
	);
}
