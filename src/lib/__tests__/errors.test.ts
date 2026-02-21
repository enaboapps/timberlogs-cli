import {describe, it, expect, vi, beforeEach} from 'vitest';
import {CliError, ErrorCode, formatError, handleError} from '../errors.js';

describe('CliError', () => {
	it('sets code and exit code', () => {
		const err = new CliError(ErrorCode.AUTH_REQUIRED, 'No key');
		expect(err.code).toBe('AUTH_REQUIRED');
		expect(err.exitCode).toBe(2);
		expect(err.message).toBe('No key');
		expect(err.name).toBe('CliError');
	});

	it('sets exit code 1 for network errors', () => {
		const err = new CliError(ErrorCode.NETWORK_ERROR, 'timeout');
		expect(err.exitCode).toBe(1);
	});

	it('sets exit code 2 for auth errors', () => {
		const err = new CliError(ErrorCode.AUTH_INVALID, 'bad key');
		expect(err.exitCode).toBe(2);
	});
});

describe('formatError', () => {
	it('formats CliError to object', () => {
		const err = new CliError(ErrorCode.NOT_FOUND, 'Log not found');
		expect(formatError(err)).toEqual({
			error: true,
			code: 'NOT_FOUND',
			message: 'Log not found',
		});
	});
});

describe('handleError', () => {
	let exitSpy: ReturnType<typeof vi.spyOn>;
	let consoleSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
		consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	it('outputs JSON for CliError in json mode', () => {
		const err = new CliError(ErrorCode.AUTH_REQUIRED, 'No key');
		handleError(err, true);
		expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify({error: true, code: 'AUTH_REQUIRED', message: 'No key'}));
		expect(exitSpy).toHaveBeenCalledWith(2);
	});

	it('outputs colored text for CliError in interactive mode', () => {
		const err = new CliError(ErrorCode.NETWORK_ERROR, 'timeout');
		handleError(err, false);
		expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('timeout'));
		expect(exitSpy).toHaveBeenCalledWith(1);
	});

	it('handles non-CliError in json mode', () => {
		handleError(new Error('unexpected'), true);
		expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('unexpected'));
		expect(exitSpy).toHaveBeenCalledWith(1);
	});

	it('handles non-CliError in interactive mode', () => {
		handleError('string error', false);
		expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('string error'));
		expect(exitSpy).toHaveBeenCalledWith(1);
	});
});
