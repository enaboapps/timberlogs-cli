import {CliError, ErrorCode} from './errors.js';

const MULTIPLIERS: Record<string, number> = {
	m: 60 * 1000,
	h: 60 * 60 * 1000,
	d: 24 * 60 * 60 * 1000,
	w: 7 * 24 * 60 * 60 * 1000,
};

const RELATIVE_PATTERN = /^(\d+)(m|h|d|w)$/;

export function parseRelativeTime(input: string): number {
	const match = RELATIVE_PATTERN.exec(input);
	if (match) {
		const value = Number(match[1]);
		const unit = match[2]!;
		return Date.now() - value * MULTIPLIERS[unit]!;
	}

	const date = new Date(input);
	if (!Number.isNaN(date.getTime())) {
		return date.getTime();
	}

	const numeric = Number(input);
	if (!Number.isNaN(numeric) && numeric > 1e12) {
		return numeric;
	}

	throw new CliError(
		ErrorCode.INVALID_INPUT,
		`Invalid time format: ${input}. Use 30m, 1h, 24h, 7d, or ISO 8601.`,
	);
}