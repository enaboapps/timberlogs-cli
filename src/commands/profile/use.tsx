import {Text} from 'ink';
import {useEffect, useState} from 'react';
import {z} from 'zod';
import {readConfig, writeConfig} from '../../lib/config.js';

export const options = z.object({
	json: z.boolean().default(false).describe('Output as JSON'),
});

export const args = z.tuple([z.string().describe('Profile name')]);

type Props = {
	options: z.infer<typeof options>;
	args: z.infer<typeof args>;
};

export default function ProfileUse({options, args}: Props) {
	const [name] = args;
	const [result, setResult] = useState<{ok: boolean; message: string} | null>(null);

	useEffect(() => {
		const config = readConfig();
		if (!config.profiles?.[name!]) {
			if (options.json) {
				console.log(JSON.stringify({error: `Profile "${name}" not found`}));
				process.exit(1);
			}

			setResult({ok: false, message: `Profile "${name}" not found. Run \`timberlogs profile list\` to see available profiles.`});
			return;
		}

		config.activeProfile = name;
		writeConfig(config);

		if (options.json) {
			console.log(JSON.stringify({activeProfile: name}));
			process.exit(0);
		}

		setResult({ok: true, message: `Switched to profile "${name}"`});
	}, []);

	if (options.json) {
		return null;
	}

	if (!result) {
		return null;
	}

	return <Text color={result.ok ? 'green' : 'red'}>{result.ok ? '✓' : '✗'} {result.message}</Text>;
}
