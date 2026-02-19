import {Text, Box, useInput} from 'ink';
import {LEVEL_COLORS} from '../lib/format.js';

type LevelStats = {
	debug: number;
	info: number;
	warn: number;
	error: number;
	total: number;
};

type Props = {
	totals: LevelStats;
	period: string;
	comparison?: {
		yesterdayTotal: number;
		changePercent: number;
		trend: 'up' | 'down' | 'stable';
	};
	groupBySource?: Array<{
		source: string;
		total: number;
		debug: number;
		info: number;
		warn: number;
		error: number;
	}>;
};

function formatNumber(n: number): string {
	return n.toLocaleString();
}

function renderBar(value: number, total: number, maxWidth: number): string {
	if (total === 0) return '';
	const filled = Math.round((value / total) * maxWidth);
	return '█'.repeat(filled) + '░'.repeat(maxWidth - filled);
}

export default function StatsView({totals, period, comparison, groupBySource}: Props) {
	useInput((input) => {
		if (input === 'q') {
			process.exit(0);
		}
	});

	const cols = process.stdout.columns || 80;
	const barWidth = Math.min(21, Math.max(10, cols - 40));

	const trendText = comparison
		? comparison.trend === 'up'
			? `+${comparison.changePercent.toFixed(1)}% ↑`
			: comparison.trend === 'down'
				? `-${Math.abs(comparison.changePercent).toFixed(1)}% ↓`
				: 'stable'
		: '';
	const trendColor = comparison
		? comparison.trend === 'up'
			? 'green'
			: comparison.trend === 'down'
				? 'red'
				: 'gray'
		: 'gray';

	if (groupBySource && groupBySource.length > 0) {
		return (
			<Box flexDirection="column">
				<Text bold>Log Volume (last {period})</Text>
				{comparison && (
					<Text>
						<Text bold>Total: {formatNumber(totals.total)}</Text>
						{'  '}
						<Text color={trendColor}>{trendText}</Text>
					</Text>
				)}
				<Text> </Text>
				<Text bold dimColor>
					{'Source'.padEnd(16)} {'Total'.padStart(8)} {'Debug'.padStart(8)} {'Info'.padStart(8)} {'Warn'.padStart(8)} {'Error'.padStart(8)}
				</Text>
				{groupBySource.map((row) => (
					<Text key={row.source}>
						{row.source.slice(0, 16).padEnd(16)} {formatNumber(row.total).padStart(8)} {formatNumber(row.debug).padStart(8)} {formatNumber(row.info).padStart(8)} {formatNumber(row.warn).padStart(8)} {formatNumber(row.error).padStart(8)}
					</Text>
				))}
				<Text dimColor>q quit</Text>
			</Box>
		);
	}

	const levels: Array<{name: string; value: number}> = [
		{name: 'debug', value: totals.debug},
		{name: 'info', value: totals.info},
		{name: 'warn', value: totals.warn},
		{name: 'error', value: totals.error},
	];

	return (
		<Box flexDirection="column">
			<Box>
				<Text bold>Log Volume (last {period})</Text>
				{comparison && (
					<>
						<Text>  </Text>
						<Text color={trendColor}>{trendText}</Text>
					</>
				)}
			</Box>
			<Text bold>Total: {formatNumber(totals.total)}</Text>
			<Text> </Text>
			{levels.map(({name, value}) => {
				const pct = totals.total > 0 ? ((value / totals.total) * 100).toFixed(1) : '0.0';
				return (
					<Text key={name}>
						<Text color={LEVEL_COLORS[name]}>{name.padEnd(8)}</Text>
						{formatNumber(value).padStart(10)}{'   '}
						<Text color={LEVEL_COLORS[name]}>{renderBar(value, totals.total, barWidth)}</Text>
						{'  '}
						<Text dimColor>{pct.padStart(5)}%</Text>
					</Text>
				);
			})}
			<Text> </Text>
			<Text dimColor>q quit</Text>
		</Box>
	);
}
