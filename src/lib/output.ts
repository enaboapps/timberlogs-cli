export function isJsonMode(flags: {json?: boolean; interactive?: boolean}): boolean {
	if (flags.json) {
		return true;
	}

	if (flags.interactive) {
		return false;
	}

	return !process.stdout.isTTY;
}

export function jsonOutput(data: unknown): never {
	console.log(JSON.stringify(data));
	process.exit(0);
}
