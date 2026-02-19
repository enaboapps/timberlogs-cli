import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {resolveApiKey, requireApiKey, maskApiKey, resolveApiUrl} from '../auth.js';
import {CliError} from '../errors.js';

vi.mock('../config.js', () => ({
	readConfig: vi.fn(() => ({})),
}));

import {readConfig} from '../config.js';

const mockedReadConfig = vi.mocked(readConfig);

describe('resolveApiKey', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = {...originalEnv};
		delete process.env['TIMBER_API_KEY'];
		mockedReadConfig.mockReturnValue({});
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it('returns flag value first', () => {
		process.env['TIMBER_API_KEY'] = 'env-key';
		mockedReadConfig.mockReturnValue({apiKey: 'config-key'});
		expect(resolveApiKey({apiKey: 'flag-key'})).toBe('flag-key');
	});

	it('falls back to env var', () => {
		process.env['TIMBER_API_KEY'] = 'env-key';
		mockedReadConfig.mockReturnValue({apiKey: 'config-key'});
		expect(resolveApiKey({})).toBe('env-key');
	});

	it('falls back to config file', () => {
		mockedReadConfig.mockReturnValue({apiKey: 'config-key'});
		expect(resolveApiKey({})).toBe('config-key');
	});

	it('returns null when no key found', () => {
		expect(resolveApiKey({})).toBeNull();
	});
});

describe('requireApiKey', () => {
	beforeEach(() => {
		const originalEnv = process.env;
		process.env = {...originalEnv};
		delete process.env['TIMBER_API_KEY'];
		mockedReadConfig.mockReturnValue({});
	});

	it('returns key when available', () => {
		expect(requireApiKey({apiKey: 'test-key'})).toBe('test-key');
	});

	it('throws CliError when no key', () => {
		expect(() => requireApiKey({})).toThrow(CliError);
		expect(() => requireApiKey({})).toThrow('No API key found');
	});
});

describe('resolveApiUrl', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = {...originalEnv};
		delete process.env['TIMBER_API_URL'];
		mockedReadConfig.mockReturnValue({});
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it('returns flag value first', () => {
		process.env['TIMBER_API_URL'] = 'https://env.example.com';
		mockedReadConfig.mockReturnValue({apiUrl: 'https://config.example.com'});
		expect(resolveApiUrl({apiUrl: 'https://flag.example.com'})).toBe('https://flag.example.com');
	});

	it('falls back to env var', () => {
		process.env['TIMBER_API_URL'] = 'https://env.example.com';
		expect(resolveApiUrl({})).toBe('https://env.example.com');
	});

	it('falls back to config file', () => {
		mockedReadConfig.mockReturnValue({apiUrl: 'https://config.example.com'});
		expect(resolveApiUrl({})).toBe('https://config.example.com');
	});

	it('returns default URL when nothing set', () => {
		expect(resolveApiUrl({})).toBe('https://timberlogs-ingest.enaboapps.workers.dev');
	});
});

describe('maskApiKey', () => {
	it('masks normal length keys', () => {
		expect(maskApiKey('tb_live_abcdefghijklmnop1234')).toBe('tb_live_****...1234');
	});

	it('masks keys of exactly 16 chars', () => {
		expect(maskApiKey('1234567890123456')).toBe('12345678****...3456');
	});

	it('returns **** for short keys', () => {
		expect(maskApiKey('short')).toBe('****');
		expect(maskApiKey('')).toBe('****');
	});
});
