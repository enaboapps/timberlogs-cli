export interface LogEntry {
	id: string;
	level: 'debug' | 'info' | 'warn' | 'error';
	message: string;
	timestamp: string;
	source?: string;
	environment?: string;
	dataset?: string;
	version?: string;
	userId?: string;
	sessionId?: string;
	requestId?: string;
	flowId?: string;
	stepIndex?: number;
	tags?: string[];
	data?: Record<string, unknown>;
	errorName?: string;
	errorStack?: string;
}

export interface LogsResponse {
	logs: LogEntry[];
	pagination: {
		total: number;
		offset: number;
		limit: number;
		hasMore: boolean;
	};
}
