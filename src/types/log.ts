import {z} from 'zod';

export const LogEntrySchema = z.object({
	id: z.string(),
	level: z.enum(['debug', 'info', 'warn', 'error']),
	message: z.string(),
	timestamp: z.union([z.string(), z.number()]),
	source: z.string().nullish(),
	environment: z.string().nullish(),
	dataset: z.string().nullish(),
	version: z.string().nullish(),
	userId: z.string().nullish(),
	sessionId: z.string().nullish(),
	requestId: z.string().nullish(),
	flowId: z.string().nullish(),
	stepIndex: z.number().nullish(),
	tags: z.array(z.string()).nullish(),
	data: z.record(z.unknown()).nullish(),
	errorName: z.string().nullish(),
	errorStack: z.string().nullish(),
});

export const LogsResponseSchema = z.object({
	logs: z.array(LogEntrySchema),
	pagination: z.object({
		total: z.number().optional(),
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
