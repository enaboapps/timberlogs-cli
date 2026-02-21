import {Text, Box} from 'ink';
import {useEffect} from 'react';
import {z} from 'zod';
import {readConfig} from '../../lib/config.js';

export const options = z.object({
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	options: z.infer<typeof options>;
};

export default function ConfigList({options}: Props) {
	const config = readConfig();

	const display = {
		authenticated: Boolean(config.sessionToken),
	};

	useEffect(() => {
		if (options.json) {
			console.log(JSON.stringify(display));
			process.exit(0);
		}
	}, []);

	if (options.json) {
		return null;
	}

	return (
		<Box flexDirection="column">
			<Text>
				<Text bold>Authenticated:  </Text>
				<Text color={display.authenticated ? 'green' : 'red'}>
					{display.authenticated ? 'Yes' : 'No'}
				</Text>
			</Text>
		</Box>
	);
}
