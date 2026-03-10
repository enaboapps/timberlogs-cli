import {useEffect} from 'react';
import type {ReactNode} from 'react';
import {createApiClient} from '../../lib/api.js';
import {LogsResponseSchema} from '../../types/log.js';
import FlowTimeline from '../FlowTimeline.js';

type Props = {
	flowId: string;
	token: string;
	onBack: () => void;
	onDone: (output: ReactNode, interactive: boolean) => void;
	onError: (message: string) => void;
};

export default function FlowShowView({flowId, token, onBack, onDone, onError}: Props) {
	useEffect(() => {
		void run();
	}, []);

	async function run() {
		try {
			const client = createApiClient({token});
			const raw = await client.get('/v1/logs', {flowId, limit: 1000});
			const response = LogsResponseSchema.parse(raw);
			const logs = response.logs;

			if (logs.length === 0) {
				onError(`No logs found for flow ${flowId}`);
				return;
			}

			const stepCount = logs.length;
			const durationMs = logs.length > 1
				? new Date(logs[logs.length - 1]!.timestamp).getTime() - new Date(logs[0]!.timestamp).getTime()
				: 0;
			const hasErrors = logs.some(l => l.level === 'error');

			onDone(
				<FlowTimeline
					flowId={flowId}
					logs={logs}
					stepCount={stepCount}
					durationMs={durationMs}
					hasErrors={hasErrors}
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
