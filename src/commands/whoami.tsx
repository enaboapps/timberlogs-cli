import {Text, Box} from 'ink';
import {useState, useEffect} from 'react';
import {z} from 'zod';
import {resolveApiKey, maskApiKey} from '../lib/auth.js';
import {createApiClient} from '../lib/api.js';
import {handleError, CliError, ErrorCode} from '../lib/errors.js';

export const options = z.object({
	'api-key': z.string().optional().describe('Override API key'),
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	options: z.infer<typeof options>;
};

type Result = {
	authenticated: boolean;
	keyPrefix?: string;
	error?: string;
};

export default function WhoAmI({options}: Props) {
	const [result, setResult] = useState<Result | null>(null);

	useEffect(() => {
		void check();
	}, []);

	async function check() {
		const key = resolveApiKey({'apiKey': options['api-key']});
		if (!key) {
			if (options.json) {
				handleError(new CliError(ErrorCode.AUTH_REQUIRED, 'Not authenticated'), true);
			}

			setResult({authenticated: false, error: 'Not authenticated. Run `timberlogs login` to get started.'});
			return;
		}

		const client = createApiClient({apiKey: key});

		try {
			await client.get('/v1/logs', {limit: 1});
		} catch (error) {
			if (options.json) {
				handleError(error, true);
			}

			setResult({
				authenticated: false,
				error: 'API key is invalid or revoked',
			});
			return;
		}

		const info = {
			authenticated: true,
			keyPrefix: maskApiKey(key),
		};

		if (options.json) {
			console.log(JSON.stringify(info));
			process.exit(0);
		}

		setResult(info);
	}

	if (options.json) {
		return null;
	}

	if (!result) {
		return <Text color="yellow">Checking authentication...</Text>;
	}

	if (!result.authenticated) {
		return <Text color="red">✗ {result.error}</Text>;
	}

	return (
		<Box flexDirection="column">
			<Text>
				<Text bold>{'Status:       '}</Text>
				<Text color="green">Authenticated</Text>
			</Text>
			<Text>
				<Text bold>{'API Key:      '}</Text>
				<Text>{result.keyPrefix}</Text>
			</Text>
		</Box>
	);
}
