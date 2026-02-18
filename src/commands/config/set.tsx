import {Text} from 'ink';
import {useState, useEffect} from 'react';
import {z} from 'zod';
import {readConfig, writeConfig, maskApiKey} from '../../lib/config.js';
import type {Config} from '../../types/config.js';

const VALID_KEYS: Record<string, keyof Config> = {
	'api-key': 'apiKey',
	'api-url': 'apiUrl',
};

export const args = z.tuple([z.string().describe('key'), z.string().describe('value')]);
export const options = z.object({
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	args: z.infer<typeof args>;
	options: z.infer<typeof options>;
};

export default function ConfigSet({args: [key, value], options}: Props) {
	const configKey = VALID_KEYS[key];
	const [result, setResult] = useState<{success: boolean; display?: string} | null>(null);

	useEffect(() => {
		if (!configKey) {
			const msg = `Invalid key: ${key}. Valid keys: ${Object.keys(VALID_KEYS).join(', ')}`;
			if (options.json) {
				console.log(JSON.stringify({error: true, code: 'INVALID_INPUT', message: msg}));
				process.exit(1);
			}

			setResult({success: false});
			return;
		}

		const config = readConfig();
		config[configKey] = value;
		writeConfig(config);

		const display = configKey === 'apiKey' ? maskApiKey(value) : value;

		if (options.json) {
			console.log(JSON.stringify({key, value: display}));
			process.exit(0);
		}

		setResult({success: true, display});
	}, []);

	if (!result) {
		return null;
	}

	if (!result.success) {
		return <Text color="red">Invalid key: {key}. Valid keys: {Object.keys(VALID_KEYS).join(', ')}</Text>;
	}

	return <Text color="green">Set {key} = {result.display}</Text>;
}
