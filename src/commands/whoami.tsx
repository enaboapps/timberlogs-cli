import {Text, Box} from 'ink';
import {useState, useEffect} from 'react';
import {z} from 'zod';
import {resolveToken} from '../lib/auth.js';
import {createApiClient} from '../lib/api.js';
import {handleError, CliError, ErrorCode} from '../lib/errors.js';

export const options = z.object({
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	options: z.infer<typeof options>;
};

type Result = {
	authenticated: boolean;
	workspace?: string;
	error?: string;
};

export default function WhoAmI({options}: Props) {
	const [result, setResult] = useState<Result | null>(null);

	useEffect(() => {
		void check();
	}, []);

	async function check() {
		const token = resolveToken();
		if (!token) {
			if (options.json) {
				handleError(new CliError(ErrorCode.AUTH_REQUIRED, 'Not authenticated'), true);
			}

			setResult({authenticated: false, error: 'Not authenticated. Run `timberlogs login` to get started.'});
			return;
		}

		const client = createApiClient({token});

		let workspaceName: string | undefined;
		try {
			const whoami = await client.get<{workspaceName?: string}>('/v1/whoami');
			workspaceName = whoami.workspaceName;
		} catch (error) {
			if (options.json) {
				handleError(error, true);
			}

			setResult({
				authenticated: false,
				error: 'Session is invalid or expired. Run `timberlogs login` to re-authenticate.',
			});
			return;
		}

		const info: Result = {
			authenticated: true,
			...(workspaceName ? {workspace: workspaceName} : {}),
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
			{result.workspace && (
				<Text>
					<Text bold>{'Workspace:    '}</Text>
					<Text>{result.workspace}</Text>
				</Text>
			)}
		</Box>
	);
}
