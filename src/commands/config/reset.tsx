import {Text, Box} from 'ink';
import {useState, useEffect} from 'react';
import {z} from 'zod';
import TextInput from 'ink-text-input';
import {deleteConfig} from '../../lib/config.js';

export const options = z.object({
	force: z.boolean().default(false).describe('Skip confirmation prompt'),
	json: z.boolean().default(false).describe('Output as JSON'),
});

type Props = {
	options: z.infer<typeof options>;
};

export default function ConfigReset({options}: Props) {
	const [confirmed, setConfirmed] = useState(options.force);
	const [done, setDone] = useState(false);
	const [input, setInput] = useState('');

	useEffect(() => {
		if (!confirmed) return;

		deleteConfig();
		setDone(true);

		if (options.json) {
			console.log(JSON.stringify({reset: true}));
			process.exit(0);
		}
	}, [confirmed]);

	if (options.json && !confirmed) {
		console.log(JSON.stringify({error: true, message: 'Use --force to skip confirmation'}));
		process.exit(1);
		return null;
	}

	if (done) {
		return <Text color="green">Config reset successfully</Text>;
	}

	return (
		<Box>
			<Text>Are you sure you want to reset config? (y/N) </Text>
			<TextInput
				value={input}
				onChange={setInput}
				onSubmit={(value) => {
					if (value.toLowerCase() === 'y' || value.toLowerCase() === 'yes') {
						setConfirmed(true);
					} else {
						console.error('Aborted');
						process.exit(1);
					}
				}}
			/>
		</Box>
	);
}
