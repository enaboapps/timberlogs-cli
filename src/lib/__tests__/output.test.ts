import {describe, it, expect, vi, beforeEach} from 'vitest';
import {isJsonMode, jsonOutput} from '../output.js';

describe('isJsonMode', () => {
	it('returns true when --json flag is set', () => {
		expect(isJsonMode({json: true})).toBe(true);
	});

	it('falls back to TTY detection', () => {
		const originalIsTTY = process.stdout.isTTY;
		Object.defineProperty(process.stdout, 'isTTY', {value: true, writable: true});
		expect(isJsonMode({})).toBe(false);
		Object.defineProperty(process.stdout, 'isTTY', {value: false, writable: true});
		expect(isJsonMode({})).toBe(true);
		Object.defineProperty(process.stdout, 'isTTY', {value: originalIsTTY, writable: true});
	});
});

describe('jsonOutput', () => {
	beforeEach(() => {
		vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	it('outputs JSON and exits', () => {
		jsonOutput({foo: 'bar'});
		expect(console.log).toHaveBeenCalledWith('{"foo":"bar"}');
		expect(process.exit).toHaveBeenCalledWith(0);
	});
});
