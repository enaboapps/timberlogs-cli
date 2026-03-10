export type ParsedCommand =
	| {type: 'builtin'; name: 'help' | 'exit' | 'clear'}
	| {type: 'command'; name: string; tokens: string[]}
	| {type: 'empty'}
	| {type: 'unknown'; input: string};

const TWO_WORD_COMMANDS = new Set(['flows show', 'config list', 'config reset']);
const ONE_WORD_COMMANDS = new Set(['logs', 'stats', 'flows', 'whoami', 'login', 'logout']);
const BUILTINS = new Set(['help', 'exit', 'clear']);

function shellSplit(input: string): string[] {
	const tokens: string[] = [];
	let current = '';
	let inSingle = false;
	let inDouble = false;

	for (const ch of input) {
		if (ch === "'" && !inDouble) {
			inSingle = !inSingle;
		} else if (ch === '"' && !inSingle) {
			inDouble = !inDouble;
		} else if (ch === ' ' && !inSingle && !inDouble) {
			if (current.length > 0) {
				tokens.push(current);
				current = '';
			}
		} else {
			current += ch;
		}
	}

	if (current.length > 0) tokens.push(current);
	return tokens;
}

export function parseReplInput(input: string): ParsedCommand {
	const trimmed = input.trim();
	if (!trimmed) return {type: 'empty'};

	const tokens = shellSplit(trimmed);
	const first = tokens[0]!.toLowerCase();

	if (BUILTINS.has(first)) {
		return {type: 'builtin', name: first as 'help' | 'exit' | 'clear'};
	}

	if (tokens.length >= 2) {
		const twoWord = `${first} ${tokens[1]!.toLowerCase()}`;
		if (TWO_WORD_COMMANDS.has(twoWord)) {
			return {type: 'command', name: twoWord, tokens: tokens.slice(2)};
		}
	}

	if (ONE_WORD_COMMANDS.has(first)) {
		return {type: 'command', name: first, tokens: tokens.slice(1)};
	}

	return {type: 'unknown', input: trimmed};
}
