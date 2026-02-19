import {Text, Box} from 'ink';
import type {LogEntry} from '../types/log.js';

type Props = {
	log: LogEntry;
};

function Field({label, value}: {label: string; value: string | undefined}) {
	if (!value) return null;
	return (
		<Text>
			<Text bold dimColor>{label.padEnd(14)}</Text>
			<Text>{value}</Text>
		</Text>
	);
}

export default function LogDetail({log}: Props) {
	return (
		<Box flexDirection="column" paddingX={1}>
			<Box marginBottom={1}>
				<Text bold inverse>{` ${log.level.toUpperCase()} `}</Text>
				<Text> </Text>
				<Text>{log.message}</Text>
			</Box>

			<Field label="Timestamp" value={String(log.timestamp)} />
			<Field label="Level" value={log.level} />
			<Field label="Source" value={log.source} />
			<Field label="Environment" value={log.environment} />
			<Field label="Dataset" value={log.dataset} />
			<Field label="Version" value={log.version} />
			<Field label="User ID" value={log.userId} />
			<Field label="Session ID" value={log.sessionId} />
			<Field label="Request ID" value={log.requestId} />
			<Field label="Flow" value={log.flowId && log.stepIndex !== undefined ? `${log.flowId} #${log.stepIndex}` : log.flowId} />
			<Field label="Tags" value={log.tags?.join(', ')} />

			{log.data && Object.keys(log.data).length > 0 && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>Data:</Text>
					<Text>{JSON.stringify(log.data, null, 2)}</Text>
				</Box>
			)}

			{(log.errorName || log.errorStack) && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold color="red">{log.errorName ?? 'Error'}</Text>
					{log.errorStack && <Text dimColor>{log.errorStack}</Text>}
				</Box>
			)}

			<Box marginTop={1}>
				<Text dimColor>Press Esc or Backspace to go back</Text>
			</Box>
		</Box>
	);
}
