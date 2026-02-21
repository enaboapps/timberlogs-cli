import {describe, it, expect, vi, beforeEach} from 'vitest';
import {parseRelativeTime} from '../time.js';
import {CliError} from '../errors.js';

describe('parseRelativeTime', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-02-19T12:00:00Z'));
	});

	it('parses minutes', () => {
		const result = parseRelativeTime('30m');
		expect(result).toBe(Date.now() - 30 * 60 * 1000);
	});

	it('parses hours', () => {
		const result = parseRelativeTime('1h');
		expect(result).toBe(Date.now() - 60 * 60 * 1000);
	});

	it('parses days', () => {
		const result = parseRelativeTime('7d');
		expect(result).toBe(Date.now() - 7 * 24 * 60 * 60 * 1000);
	});

	it('parses weeks', () => {
		const result = parseRelativeTime('2w');
		expect(result).toBe(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000);
	});

	it('parses ISO 8601 strings', () => {
		const result = parseRelativeTime('2026-02-18T14:00:00Z');
		expect(result).toBe(new Date('2026-02-18T14:00:00Z').getTime());
	});

	it('parses numeric timestamps', () => {
		const ts = 1771500000000;
		const result = parseRelativeTime(String(ts));
		expect(result).toBe(ts);
	});

	it('treats small numeric strings as dates if parseable', () => {
		// '12345' is parsed as a year by Date constructor, so it returns a valid timestamp
		const result = parseRelativeTime('12345');
		expect(result).toBe(new Date('12345').getTime());
	});

	it('rejects invalid input', () => {
		expect(() => parseRelativeTime('abc')).toThrow(CliError);
		expect(() => parseRelativeTime('abc')).toThrow('Invalid time format');
	});

	it('rejects empty string', () => {
		expect(() => parseRelativeTime('')).toThrow(CliError);
	});
});
