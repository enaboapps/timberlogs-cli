import {Text, Box} from 'ink';
import {useEffect} from 'react';
import {z} from 'zod';
import {readConfig} from '../../lib/config.js';
import {maskApiKey} from '../../lib/auth.js';
import {DEFAULT_API_URL} from '../../types/config.js';

export const options = z.object({
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	options: z.infer<typeof options>;
};

export default function ConfigList({options}: Props) {
	const config = readConfig();

	const display = {
		apiKey: config.apiKey ? maskApiKey(config.apiKey) : '(not set)',
		apiUrl: config.apiUrl ?? DEFAULT_API_URL,
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
				<Text bold>API Key:  </Text>
				<Text>{display.apiKey}</Text>
			</Text>
			<Text>
				<Text bold>API URL:  </Text>
				<Text>{display.apiUrl}</Text>
			</Text>
		</Box>
	);
}
