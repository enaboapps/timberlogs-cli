import Pastel from 'pastel';

// When --json is passed, Ink's renderer still writes ANSI escape codes to
// stdout (cursor hide/show, erase line, etc.) even when components return null.
// Strip those codes so piped JSON output stays clean.
if (process.argv.includes('--json')) {
	const origWrite = process.stdout.write.bind(process.stdout);
	const ansiPattern =
		// eslint-disable-next-line no-control-regex
		/[\x1B\x9B][[()#;?]*(?:\d{1,4}(?:;\d{0,4})*)?[\dA-ORZcf-nq-uy=><~]/g;

	process.stdout.write = function (
		chunk: unknown,
		...args: unknown[]
	): boolean {
		if (typeof chunk === 'string') {
			const stripped = chunk.replace(ansiPattern, '');
			if (stripped.length === 0) {
				return true;
			}

			return origWrite(stripped, ...(args as []));
		}

		return origWrite(chunk as Uint8Array, ...(args as []));
	} as typeof process.stdout.write;
}

const app = new Pastel({
	importMeta: import.meta,
	name: 'timberlogs',
});

await app.run();
