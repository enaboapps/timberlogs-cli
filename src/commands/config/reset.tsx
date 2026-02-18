import {Text} from 'ink';
import {useEffect} from 'react';
import {z} from 'zod';
import {deleteConfig} from '../../lib/config.js';

export const options = z.object({
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	options: z.infer<typeof options>;
};

export default function ConfigReset({options}: Props) {
	useEffect(() => {
		deleteConfig();

		if (options.json) {
			console.log(JSON.stringify({reset: true}));
			process.exit(0);
		}
	}, []);

	if (options.json) {
		return null;
	}

	return <Text color="green">Config reset successfully</Text>;
}
