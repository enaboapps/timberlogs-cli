import {defineConfig} from 'tsup';

export default defineConfig([
	{
		entry: ['src/cli.tsx'],
		format: 'esm',
		target: 'node20',
		banner: {js: '#!/usr/bin/env node'},
		outDir: 'dist',
		clean: true,
	},
	{
		entry: [
			'src/commands/**/*.tsx',
			'src/commands/**/*.ts',
			'src/lib/**/*.ts',
			'src/types/**/*.ts',
			'src/components/**/*.tsx',
			'!src/**/__tests__/**',
			'!src/**/*.test.*',
		],
		format: 'esm',
		target: 'node20',
		outDir: 'dist',
		bundle: false,
		clean: false,
	},
]);
