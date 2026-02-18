import {Text} from 'ink';
import {useEffect} from 'react';
import {z} from 'zod';
import {readConfig, writeConfig} from '../lib/config.js';

export const options = z.object({
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	options: z.infer<typeof options>;
};

export default function Logout({options}: Props) {
	const config = readConfig();
	const hadKey = Boolean(config.apiKey);

	useEffect(() => {
		if (hadKey) {
			delete config.apiKey;
			writeConfig(config);
		}

		if (options.json) {
			console.log(JSON.stringify({loggedOut: true}));
			process.exit(0);
		}
	}, []);

	if (options.json) {
		return null;
	}

	if (!hadKey) {
		return <Text color="yellow">No API key configured</Text>;
	}

	return <Text color="green">✓ Logged out — API key removed</Text>;
}
