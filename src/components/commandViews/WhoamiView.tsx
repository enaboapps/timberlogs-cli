import {useEffect} from 'react';
import type {ReactNode} from 'react';
import {Text, Box} from 'ink';
import {createApiClient} from '../../lib/api.js';

type Props = {
	token: string;
	onDone: (output: ReactNode, interactive: boolean) => void;
	onError: (message: string) => void;
};

export default function WhoamiView({token, onDone, onError}: Props) {
	useEffect(() => {
		void run();
	}, []);

	async function run() {
		try {
			const client = createApiClient({token});
			const whoami = await client.get<{organizationName?: string}>('/v1/whoami');
			onDone(
				<Box flexDirection="column">
					<Text><Text bold>{'Status:       '}</Text><Text color="green">Authenticated</Text></Text>
					{whoami.organizationName ? (
						<Text><Text bold>{'Organization: '}</Text><Text>{whoami.organizationName}</Text></Text>
					) : null}
				</Box>,
				false,
			);
		} catch (err) {
			onError(err instanceof Error ? err.message : String(err));
		}
	}

	return null;
}
