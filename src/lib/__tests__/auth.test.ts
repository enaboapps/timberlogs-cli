import {describe, it, expect, vi, beforeEach} from 'vitest';
import {resolveToken, requireToken} from '../auth.js';
import {CliError} from '../errors.js';

vi.mock('../config.js', () => ({
	readConfig: vi.fn(() => ({})),
}));

import {readConfig} from '../config.js';

const mockedReadConfig = vi.mocked(readConfig);

describe('resolveToken', () => {
	beforeEach(() => {
		mockedReadConfig.mockReturnValue({});
	});

	it('returns session token from config', () => {
		mockedReadConfig.mockReturnValue({sessionToken: 'tl_sess_abc123'});
		expect(resolveToken()).toBe('tl_sess_abc123');
	});

	it('returns null when no token found', () => {
		expect(resolveToken()).toBeNull();
	});
});

describe('requireToken', () => {
	beforeEach(() => {
		mockedReadConfig.mockReturnValue({});
	});

	it('returns token when available', () => {
		mockedReadConfig.mockReturnValue({sessionToken: 'tl_sess_abc123'});
		expect(requireToken()).toBe('tl_sess_abc123');
	});

	it('throws CliError when no token', () => {
		expect(() => requireToken()).toThrow(CliError);
		expect(() => requireToken()).toThrow('Not authenticated');
	});
});
