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
		entry: {
			'commands/index': 'src/commands/index.tsx',
		},
		format: 'esm',
		target: 'node20',
		outDir: 'dist',
		clean: false,
	},
]);
