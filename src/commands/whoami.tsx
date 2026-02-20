import {Text, Box} from 'ink';
import {useState, useEffect} from 'react';
import {z} from 'zod';
import {resolveApiKey, maskApiKey} from '../lib/auth.js';
import {readConfig} from '../lib/config.js';
import {createApiClient} from '../lib/api.js';
import {handleError, CliError, ErrorCode} from '../lib/errors.js';

export const options = z.object({
	apiKey: z.string().optional().describe('Override API key'),
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	options: z.infer<typeof options>;
};

type Result = {
	authenticated: boolean;
	keyPrefix?: string;
	profile?: string;
	organization?: string;
	error?: string;
};

export default function WhoAmI({options}: Props) {
	const [result, setResult] = useState<Result | null>(null);

	useEffect(() => {
		void check();
	}, []);

	async function check() {
		const key = resolveApiKey({apiKey: options.apiKey});
		if (!key) {
			if (options.json) {
				handleError(new CliError(ErrorCode.AUTH_REQUIRED, 'Not authenticated'), true);
			}

			setResult({authenticated: false, error: 'Not authenticated. Run `timberlogs login` to get started.'});
			return;
		}

		const client = createApiClient({apiKey: key});

		let orgName: string | undefined;
		try {
			const whoami = await client.get<{organizationName?: string}>('/v1/whoami');
			orgName = whoami.organizationName;
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

		const config = readConfig();
		const info: Result = {
			authenticated: true,
			keyPrefix: maskApiKey(key),
			...(orgName ? {organization: orgName} : {}),
			...(config.activeProfile ? {profile: config.activeProfile} : {}),
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
			{result.organization && (
				<Text>
					<Text bold>{'Organization: '}</Text>
					<Text>{result.organization}</Text>
				</Text>
			)}
			{result.profile && (
				<Text>
					<Text bold>{'Profile:      '}</Text>
					<Text>{result.profile}</Text>
				</Text>
			)}
			<Text>
				<Text bold>{'API Key:      '}</Text>
				<Text>{result.keyPrefix}</Text>
			</Text>
		</Box>
	);
}
