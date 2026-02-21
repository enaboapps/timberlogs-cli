import type {LogEntry} from '../types/log.js';

export type OutputFormat = 'json' | 'jsonl' | 'csv' | 'text' | 'syslog' | 'obl';

const CSV_COLUMNS = [
	'timestamp',
	'level',
	'message',
	'source',
	'environment',
	'dataset',
	'userId',
	'sessionId',
	'requestId',
	'flowId',
	'stepIndex',
	'errorName',
	'tags',
] as const;

const SYSLOG_SEVERITY: Record<string, number> = {
	error: 3,
	warn: 4,
	info: 6,
	debug: 7,
};

function escapeCsv(value: string): string {
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}

	return value;
}

function formatTimestamp(ts: string | number): string {
	if (typeof ts === 'number') {
		return new Date(ts).toISOString();
	}

	return ts;
}

function toSyslog(log: LogEntry): string {
	const severity = SYSLOG_SEVERITY[log.level] ?? 6;
	const facility = 1; // user-level
	const priority = facility * 8 + severity;
	const ts = formatTimestamp(log.timestamp);
	const hostname = '-';
	const appName = log.source ?? '-';
	const procId = log.sessionId ?? '-';
	const msgId = log.requestId ?? '-';
	return `<${priority}>1 ${ts} ${hostname} ${appName} ${procId} ${msgId} - ${log.message}`;
}

function toObl(logs: LogEntry[]): string {
	const sessions: Record<string, {id: string; events: Array<Record<string, unknown>>; started?: string; ended?: string}> = {};

	for (const log of logs) {
		const sessId = log.sessionId ?? 'default';
		if (!sessions[sessId]) {
			sessions[sessId] = {id: sessId, events: []};
		}

		const session = sessions[sessId]!;
		const ts = formatTimestamp(log.timestamp);

		if (!session.started || ts < session.started) {
			session.started = ts;
		}

		if (!session.ended || ts > session.ended) {
			session.ended = ts;
		}

		session.events.push({
			id: log.id,
			timestamp: ts,
			type: 'note',
			text: log.message,
			...(log.data ?? {}),
		});
	}

	const obl = {
		format: 'open-board-log-0.1',
		user_id: logs[0]?.userId ?? undefined,
		source: logs[0]?.source ?? undefined,
		sessions: Object.values(sessions).map((s) => ({
			id: s.id,
			type: 'log',
			started: s.started,
			ended: s.ended,
			events: s.events,
		})),
	};

	return JSON.stringify(obl, null, 2);
}

export function formatLogs(logs: LogEntry[], format: OutputFormat): string {
	switch (format) {
		case 'json':
			return JSON.stringify(logs, null, 2);

		case 'jsonl':
			return logs.map((log) => JSON.stringify(log)).join('\n');

		case 'csv': {
			const header = CSV_COLUMNS.join(',');
			const rows = logs.map((log) =>
				CSV_COLUMNS.map((col) => {
					const value = log[col as keyof LogEntry];
					if (value === null || value === undefined) {
						return '';
					}

					if (Array.isArray(value)) {
						return escapeCsv(value.join(';'));
					}

					return escapeCsv(String(value));
				}).join(','),
			);
			return [header, ...rows].join('\n');
		}

		case 'text':
			return logs
				.map((log) => {
					const ts = formatTimestamp(log.timestamp);
					const level = log.level.toUpperCase().padEnd(5);
					const source = log.source ?? 'unknown';
					return `${ts} [${level}] ${source}: ${log.message}`;
				})
				.join('\n');

		case 'syslog':
			return logs.map((log) => toSyslog(log)).join('\n');

		case 'obl':
			return toObl(logs);
	}
}
