import {Text, Box} from 'ink';
import Spinner from 'ink-spinner';
import {useState, useEffect} from 'react';
import {exec} from 'node:child_process';
import {z} from 'zod';
import {readConfig, writeConfig} from '../lib/config.js';
import {handleError} from '../lib/errors.js';
import {API_URL} from '../types/config.js';

export const options = z.object({
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	options: z.infer<typeof options>;
};

type DeviceResponse = {
	device_code: string;
	user_code: string;
	verification_uri: string;
};

type TokenResponse = {
	access_token: string;
	organization_name?: string;
};

type TokenErrorResponse = {
	error: string;
	error_description?: string;
};

const POLL_INTERVAL_MS = 5000;

function openBrowser(url: string): void {
	const command =
		process.platform === 'darwin'
			? `open "${url}"`
			: process.platform === 'win32'
				? `start "${url}"`
				: `xdg-open "${url}"`;

	exec(command, () => {
		// Ignore errors — user can open URL manually
	});
}

export default function Login({options}: Props) {
	const [status, setStatus] = useState<'init' | 'polling' | 'success' | 'error'>('init');
	const [errorMsg, setErrorMsg] = useState('');
	const [userCode, setUserCode] = useState('');
	const [orgName, setOrgName] = useState<string | undefined>();

	useEffect(() => {
		void startDeviceFlow();
	}, []);

	async function startDeviceFlow() {
		let device: DeviceResponse;
		try {
			const response = await fetch(`${API_URL}/v1/auth/device`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
			});

			if (!response.ok) {
				const body = await response.text();
				throw new Error(`Failed to start device flow: ${response.status} ${body}`);
			}

			device = (await response.json()) as DeviceResponse;
		} catch (error) {
			if (options.json) {
				handleError(error, true);
			}

			setStatus('error');
			setErrorMsg(error instanceof Error ? error.message : String(error));
			return;
		}

		setUserCode(device.user_code);
		setStatus('polling');

		const verificationUrl = `${device.verification_uri}?code=${device.user_code}`;
		openBrowser(verificationUrl);

		void pollForToken(device.device_code);
	}

	async function pollForToken(deviceCode: string) {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

			let response: Response;
			try {
				response = await fetch(`${API_URL}/v1/auth/device/token`, {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify({device_code: deviceCode}),
				});
			} catch (error) {
				setStatus('error');
				setErrorMsg(error instanceof Error ? error.message : String(error));
				return;
			}

			if (response.ok) {
				const token = (await response.json()) as TokenResponse;

				const config = readConfig();
				config.sessionToken = token.access_token;
				writeConfig(config);

				setOrgName(token.organization_name);

				if (options.json) {
					console.log(JSON.stringify({
						authenticated: true,
						...(token.organization_name ? {organization: token.organization_name} : {}),
					}));
					process.exit(0);
				}

				setStatus('success');
				return;
			}

			let errorBody: TokenErrorResponse;
			try {
				errorBody = (await response.json()) as TokenErrorResponse;
			} catch {
				setStatus('error');
				setErrorMsg(`Unexpected response: ${response.status}`);
				return;
			}

			if (errorBody.error === 'authorization_pending') {
				continue;
			}

			if (errorBody.error === 'expired_token') {
				setStatus('error');
				setErrorMsg('Device code expired. Please run `timberlogs login` again.');
				return;
			}

			setStatus('error');
			setErrorMsg(errorBody.error_description ?? errorBody.error);
			return;
		}
	}

	if (options.json && status === 'init') {
		return null;
	}

	if (status === 'init') {
		return null;
	}

	if (status === 'polling') {
		return (
			<Box flexDirection="column">
				<Text>
					<Text color="cyan"><Spinner type="dots" /></Text>
					{' '}Waiting for browser authentication...
				</Text>
				<Text> </Text>
				<Text>Your code: <Text bold color="yellow">{userCode}</Text></Text>
				<Text dimColor>If the browser didn&apos;t open, visit the URL manually and enter the code above.</Text>
			</Box>
		);
	}

	if (status === 'error') {
		return <Text color="red">✗ {errorMsg}</Text>;
	}

	if (status === 'success') {
		return (
			<Box flexDirection="column">
				<Text color="green">✓ Authenticated successfully</Text>
				{orgName && <Text color="green">✓ Organization: {orgName}</Text>}
			</Box>
		);
	}

	return null;
}
