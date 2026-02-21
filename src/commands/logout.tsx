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
	const wasAuthenticated = Boolean(config.sessionToken);

	useEffect(() => {
		if (wasAuthenticated) {
			delete config.sessionToken;
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

	if (!wasAuthenticated) {
		return <Text color="yellow">Not logged in</Text>;
	}

	return <Text color="green">✓ Logged out</Text>;
}
