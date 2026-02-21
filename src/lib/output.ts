export function isJsonMode(flags: {json?: boolean}): boolean {
	if (flags.json) {
		return true;
	}

	return !process.stdout.isTTY;
}

export function jsonOutput(data: unknown): never {
	console.log(JSON.stringify(data));
	process.exit(0);
}
