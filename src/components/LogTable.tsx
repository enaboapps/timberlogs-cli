import {Text, Box, useInput} from 'ink';
import {useState} from 'react';
import type {LogEntry, LogsResponse} from '../types/log.js';
import {LEVEL_COLORS, formatTime} from '../lib/format.js';
import LogDetail from './LogDetail.js';

type Props = {
	logs: LogEntry[];
	pagination: LogsResponse['pagination'];
	filterSummary?: string;
};

export default function LogTable({logs, pagination, filterSummary}: Props) {
	const [cursor, setCursor] = useState(0);
	const [expanded, setExpanded] = useState<number | null>(null);

	const maxRows = Math.max(1, Math.min(logs.length, (process.stdout.rows || 24) - 5));
	const cols = process.stdout.columns || 80;

	useInput((input, key) => {
		if (expanded !== null) {
			if (key.escape || key.backspace || key.delete) {
				setExpanded(null);
			}

			return;
		}

		if (key.upArrow) {
			setCursor(c => Math.max(0, c - 1));
		} else if (key.downArrow) {
			setCursor(c => Math.min(logs.length - 1, c + 1));
		} else if (key.return) {
			setExpanded(cursor);
		} else if (input === 'q') {
			process.exit(0);
		}
	});

	if (expanded !== null && logs[expanded]) {
		return <LogDetail log={logs[expanded]} />;
	}

	if (logs.length === 0) {
		return <Text dimColor>No logs found{filterSummary ? ` ${filterSummary}` : ''}</Text>;
	}

	const scrollOffset = Math.max(0, cursor - maxRows + 1);
	const visible = logs.slice(scrollOffset, scrollOffset + maxRows);

	const levelW = 5;
	const timeW = 12;
	const sourceW = 16;
	const msgW = Math.max(20, cols - levelW - timeW - sourceW - 6);

	return (
		<Box flexDirection="column">
			<Text dimColor>
				Showing {logs.length} logs{filterSummary ? ` ${filterSummary}` : ''}
			</Text>

			<Text bold dimColor>
				{'LEVEL'.padEnd(levelW)} {'TIME'.padEnd(timeW)} {'SOURCE'.padEnd(sourceW)} MESSAGE
			</Text>

			{visible.map((log, i) => {
				const idx = scrollOffset + i;
				const isSelected = idx === cursor;
				const level = log.level.padEnd(levelW);
				const time = formatTime(log.timestamp).padEnd(timeW);
				const source = (log.source ?? '').slice(0, sourceW).padEnd(sourceW);
				const msg = log.message.slice(0, msgW);

				return (
					<Text key={log.id} inverse={isSelected}>
						<Text color={LEVEL_COLORS[log.level]}>{level}</Text>
						{' '}
						<Text dimColor>{time}</Text>
						{' '}
						<Text>{source}</Text>
						{' '}
						<Text>{msg}</Text>
					</Text>
				);
			})}

			<Text dimColor>
				{pagination.total != null ? `${pagination.offset + logs.length}/${pagination.total} logs` : `${logs.length} logs`}
				{pagination.hasMore ? '' : ' (end)'}
				{'  ↑↓ navigate  Enter expand  q quit'}
			</Text>
		</Box>
	);
}
