import {Box, Text} from 'ink';
import type {ReactNode} from 'react';

export type ReplEntry =
	| {kind: 'command'; input: string}
	| {kind: 'output'; content: ReactNode}
	| {kind: 'error'; message: string};

export default function ReplOutput({entry}: {entry: ReplEntry}) {
	if (entry.kind === 'command') {
		return <Text dimColor>❯ {entry.input}</Text>;
	}

	if (entry.kind === 'error') {
		return <Text color="red">✗ {entry.message}</Text>;
	}

	return <Box>{entry.content as ReactNode}</Box>;
}
