import {Text, Box} from 'ink';
import {useEffect} from 'react';
import {z} from 'zod';
import {readConfig} from '../../lib/config.js';
import {maskApiKey} from '../../lib/auth.js';

export const options = z.object({
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	options: z.infer<typeof options>;
};

export default function ProfileList({options}: Props) {
	const config = readConfig();
	const profiles = config.profiles ?? {};
	const active = config.activeProfile;
	const names = Object.keys(profiles);

	useEffect(() => {
		if (options.json) {
			console.log(JSON.stringify({
				activeProfile: active ?? null,
				profiles: Object.fromEntries(
					names.map(name => [name, {apiKey: maskApiKey(profiles[name]!.apiKey)}]),
				),
			}));
			process.exit(0);
		}
	}, []);

	if (options.json) {
		return null;
	}

	if (names.length === 0) {
		return <Text dimColor>No profiles configured. Run `timberlogs profile add {'<name>'}` to create one.</Text>;
	}

	return (
		<Box flexDirection="column">
			{names.map(name => (
				<Text key={name}>
					<Text>{name === active ? '* ' : '  '}</Text>
					<Text bold={name === active}>{name}</Text>
					<Text dimColor>  {maskApiKey(profiles[name]!.apiKey)}</Text>
				</Text>
			))}
		</Box>
	);
}
