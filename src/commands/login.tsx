import {Text, Box} from 'ink';
import TextInput from 'ink-text-input';
import {useState, useEffect} from 'react';
import {z} from 'zod';
import {readConfig, writeConfig} from '../lib/config.js';
import {maskApiKey} from '../lib/auth.js';
import {createApiClient} from '../lib/api.js';
import {handleError} from '../lib/errors.js';

export const options = z.object({
	'api-key': z.string().optional().describe('API key to store'),
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	options: z.infer<typeof options>;
};

export default function Login({options}: Props) {
	const [inputValue, setInputValue] = useState('');
	const [status, setStatus] = useState<'input' | 'validating' | 'success' | 'error'>('input');
	const [errorMsg, setErrorMsg] = useState('');

	const apiKeyFromFlag = options['api-key'];

	useEffect(() => {
		if (apiKeyFromFlag) {
			void validateAndStore(apiKeyFromFlag);
		}
	}, []);

	async function validateAndStore(key: string) {
		setStatus('validating');

		const client = createApiClient({apiKey: key});

		try {
			await client.get('/v1/logs', {limit: 1});
		} catch (error) {
			if (options.json) {
				handleError(error, true);
			}

			setStatus('error');
			setErrorMsg(error instanceof Error ? error.message : String(error));
			return;
		}

		const config = readConfig();
		config.apiKey = key;
		writeConfig(config);

		if (options.json) {
			console.log(JSON.stringify({authenticated: true, keyPrefix: maskApiKey(key)}));
			process.exit(0);
		}

		setStatus('success');
	}

	function handleSubmit(value: string) {
		const trimmed = value.trim();
		if (trimmed) {
			void validateAndStore(trimmed);
		}
	}

	if (options.json) {
		return null;
	}

	if (apiKeyFromFlag && status === 'input') {
		return null;
	}

	if (status === 'validating') {
		return <Text color="yellow">Validating API key...</Text>;
	}

	if (status === 'error') {
		return <Text color="red">✗ {errorMsg}</Text>;
	}

	if (status === 'success') {
		return (
			<Box flexDirection="column">
				<Text color="green">✓ Authenticated successfully</Text>
				<Text color="green">✓ API key saved to ~/.config/timberlogs/config.json</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text>Paste your API key (from app.timberlogs.dev {'>'} Settings {'>'} API Keys):</Text>
			<Box>
				<Text>{'> '}</Text>
				<TextInput value={inputValue} onChange={setInputValue} onSubmit={handleSubmit} mask="*" />
			</Box>
		</Box>
	);
}
