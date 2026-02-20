import {Text, Box} from 'ink';
import TextInput from 'ink-text-input';
import {useState, useEffect} from 'react';
import {z} from 'zod';
import {readConfig, writeConfig} from '../../lib/config.js';
import {maskApiKey} from '../../lib/auth.js';
import {createApiClient} from '../../lib/api.js';
import {handleError} from '../../lib/errors.js';

export const options = z.object({
	apiKey: z.string().optional().describe('API key for the profile'),
	json: z.boolean().default(false).describe('Output as JSON'),
});

export const args = z.tuple([z.string().optional().describe('Profile name (defaults to org name)')]);

type Props = {
	options: z.infer<typeof options>;
	args: z.infer<typeof args>;
};

export default function ProfileAdd({options, args}: Props) {
	const [nameArg] = args;
	const [inputValue, setInputValue] = useState('');
	const [status, setStatus] = useState<'input' | 'validating' | 'success' | 'error'>('input');
	const [errorMsg, setErrorMsg] = useState('');
	const [savedProfile, setSavedProfile] = useState('');

	const apiKeyFromFlag = options.apiKey;

	useEffect(() => {
		if (apiKeyFromFlag) {
			void validateAndStore(apiKeyFromFlag);
		}
	}, []);

	async function validateAndStore(key: string) {
		setStatus('validating');

		const client = createApiClient({apiKey: key});

		let orgName: string | undefined;
		try {
			const whoami = await client.get<{organizationName?: string}>('/v1/whoami');
			orgName = whoami.organizationName;
		} catch (error) {
			if (options.json) {
				handleError(error, true);
			}

			setStatus('error');
			setErrorMsg(error instanceof Error ? error.message : String(error));
			return;
		}

		const profileName = nameArg ?? orgName ?? 'default';

		const config = readConfig();
		if (!config.profiles) {
			config.profiles = {};
		}

		config.profiles[profileName] = {apiKey: key};
		config.activeProfile = profileName;
		writeConfig(config);

		setSavedProfile(profileName);

		if (options.json) {
			console.log(JSON.stringify({profile: profileName, active: true, keyPrefix: maskApiKey(key)}));
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
				<Text color="green">✓ Profile &quot;{savedProfile}&quot; added and set as active</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text>Enter API key{nameArg ? ` for profile "${nameArg}"` : ''}:</Text>
			<Box>
				<Text>{'> '}</Text>
				<TextInput value={inputValue} onChange={setInputValue} onSubmit={handleSubmit} mask="*" />
			</Box>
		</Box>
	);
}
