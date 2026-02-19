import {z} from 'zod';

export const LogEntrySchema = z.object({
	id: z.string(),
	level: z.enum(['debug', 'info', 'warn', 'error']),
	message: z.string(),
	timestamp: z.string(),
	source: z.string().optional(),
	environment: z.string().optional(),
	dataset: z.string().optional(),
	version: z.string().optional(),
	userId: z.string().optional(),
	sessionId: z.string().optional(),
	requestId: z.string().optional(),
	flowId: z.string().optional(),
	stepIndex: z.number().optional(),
	tags: z.array(z.string()).optional(),
	data: z.record(z.unknown()).optional(),
	errorName: z.string().optional(),
	errorStack: z.string().optional(),
});

export const LogsResponseSchema = z.object({
	logs: z.array(LogEntrySchema),
	pagination: z.object({
		total: z.number(),
		offset: z.number(),
		limit: z.number(),
		hasMore: z.boolean(),
	}),
});

export const StatsResponseSchema = z.object({
	stats: z.array(z.record(z.unknown())),
	totals: z.record(z.number()).optional(),
});

export const StatsSummaryResponseSchema = z.object({
	today: z.number().optional(),
	yesterday: z.number().optional(),
	totals: z.record(z.number()).optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;
export type LogsResponse = z.infer<typeof LogsResponseSchema>;
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
export type StatsSummaryResponse = z.infer<typeof StatsSummaryResponseSchema>;
