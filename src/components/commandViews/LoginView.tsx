import {Text, Box} from 'ink';
import Spinner from 'ink-spinner';
import {useState, useEffect} from 'react';
import type {ReactNode} from 'react';
import {exec} from 'node:child_process';
import {readConfig, writeConfig} from '../../lib/config.js';
import {API_URL} from '../../types/config.js';

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
	exec(command, () => {});
}

type Props = {
	onDone: (output: ReactNode, interactive: boolean) => void;
	onError: (message: string) => void;
};

export default function LoginView({onDone, onError}: Props) {
	const [status, setStatus] = useState<'init' | 'polling' | 'done'>('init');
	const [userCode, setUserCode] = useState('');

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
		} catch (err) {
			onError(err instanceof Error ? err.message : String(err));
			return;
		}

		setUserCode(device.user_code);
		setStatus('polling');

		const verificationUrl = `${device.verification_uri}?code=${device.user_code}`;
		openBrowser(verificationUrl);

		void pollForToken(device.device_code);
	}

	async function pollForToken(deviceCode: string) {
		while (true) {
			await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

			let response: Response;
			try {
				response = await fetch(`${API_URL}/v1/auth/device/token`, {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify({device_code: deviceCode}),
				});
			} catch (err) {
				onError(err instanceof Error ? err.message : String(err));
				return;
			}

			if (response.ok) {
				const token = (await response.json()) as TokenResponse;
				const config = readConfig();
				config.sessionToken = token.access_token;
				writeConfig(config);
				setStatus('done');
				onDone(
					<Box flexDirection="column">
						<Text color="green">✓ Authenticated successfully</Text>
						{token.organization_name ? (
							<Text color="green">✓ Organization: {token.organization_name}</Text>
						) : null}
					</Box>,
					false,
				);
				return;
			}

			let errorBody: TokenErrorResponse;
			try {
				errorBody = (await response.json()) as TokenErrorResponse;
			} catch {
				onError(`Unexpected response: ${response.status}`);
				return;
			}

			if (errorBody.error === 'authorization_pending') continue;

			if (errorBody.error === 'expired_token') {
				onError('Device code expired. Run `login` again.');
				return;
			}

			onError(errorBody.error_description ?? errorBody.error);
			return;
		}
	}

	if (status === 'init') return null;
	if (status === 'done') return null;

	return (
		<Box flexDirection="column">
			<Text>
				<Text color="cyan"><Spinner type="dots" /></Text>
				{' '}Waiting for browser authentication...
			</Text>
			<Text>Your code: <Text bold color="yellow">{userCode}</Text></Text>
			<Text dimColor>If the browser didn&apos;t open, visit the URL and enter the code above.</Text>
		</Box>
	);
}
