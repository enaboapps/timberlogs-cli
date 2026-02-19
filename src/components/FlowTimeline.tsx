import {Text, Box, useInput} from 'ink';
import type {LogEntry} from '../types/log.js';
import {LEVEL_COLORS, formatTime} from '../lib/format.js';

type Props = {
	flowId: string;
	logs: LogEntry[];
	stepCount: number;
	durationMs: number;
	hasErrors: boolean;
};

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(3)}s`;
}

function formatDataInline(data: Record<string, unknown> | undefined, maxWidth: number): string {
	if (!data) return '';
	const entries = Object.entries(data).slice(0, 3);
	const parts = entries.map(([k, v]) => {
		const val = typeof v === 'string' ? v : JSON.stringify(v);
		return `${k}=${val}`;
	});
	const result = parts.join(' ');
	return result.length > maxWidth ? result.slice(0, maxWidth - 1) + '…' : result;
}

export default function FlowTimeline({flowId, logs, stepCount, durationMs, hasErrors}: Props) {
	useInput((input) => {
		if (input === 'q') {
			process.exit(0);
		}
	});

	const cols = process.stdout.columns || 80;
	const stepW = String(logs.length).length + 1;
	const errorCount = logs.filter(l => l.level === 'error').length;

	return (
		<Box flexDirection="column">
			<Text bold>Flow: {flowId}</Text>
			<Text dimColor>{'─'.repeat(Math.min(60, cols))}</Text>

			{logs.map((log) => {
				const step = `#${log.stepIndex ?? '?'}`.padStart(stepW + 1);
				const time = formatTime(log.timestamp);
				const level = log.level.padEnd(5);
				const dataStr = formatDataInline(log.data, Math.max(10, cols - stepW - 14 - 6 - log.message.length - 4));

				return (
					<Text key={log.id}>
						<Text dimColor>{step}</Text>
						{'  '}
						<Text dimColor>{time}</Text>
						{'  '}
						<Text color={LEVEL_COLORS[log.level]}>{level}</Text>
						{'  '}
						<Text>{log.message}</Text>
						{dataStr ? <Text dimColor>  {dataStr}</Text> : null}
					</Text>
				);
			})}

			<Text dimColor>{'─'.repeat(Math.min(60, cols))}</Text>
			<Text>
				<Text bold>Steps: </Text><Text>{stepCount}</Text>
				<Text>  |  </Text>
				<Text bold>Duration: </Text><Text>{formatDuration(durationMs)}</Text>
				<Text>  |  </Text>
				<Text bold>Errors: </Text><Text color={hasErrors ? 'red' : 'green'}>{errorCount}</Text>
			</Text>
			<Text dimColor>q quit</Text>
		</Box>
	);
}
