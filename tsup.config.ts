import {defineConfig} from 'tsup';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {version} = require('./package.json') as {version: string};

export default defineConfig([
	{
		entry: ['src/cli.tsx'],
		format: 'esm',
		target: 'node20',
		banner: {js: '#!/usr/bin/env node'},
		outDir: 'dist',
		clean: true,
		define: {'CLI_VERSION': JSON.stringify(version)},
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
		define: {'CLI_VERSION': JSON.stringify(version)},
	},
]);
