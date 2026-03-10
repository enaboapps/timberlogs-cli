import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {useState} from 'react';

type Props = {
	history: string[];
	onSubmit: (input: string) => void;
	disabled: boolean;
};

export default function ReplPrompt({history, onSubmit, disabled}: Props) {
	const [value, setValue] = useState('');
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [draft, setDraft] = useState('');

	useInput((_, key) => {
		if (disabled) return;
		if (key.upArrow) {
			if (history.length === 0) return;
			if (historyIndex === -1) {
				setDraft(value);
				const idx = history.length - 1;
				setHistoryIndex(idx);
				setValue(history[idx]!);
			} else if (historyIndex > 0) {
				const idx = historyIndex - 1;
				setHistoryIndex(idx);
				setValue(history[idx]!);
			}
		} else if (key.downArrow) {
			if (historyIndex === -1) return;
			if (historyIndex < history.length - 1) {
				const idx = historyIndex + 1;
				setHistoryIndex(idx);
				setValue(history[idx]!);
			} else {
				setHistoryIndex(-1);
				setValue(draft);
			}
		}
	});

	function handleChange(val: string) {
		if (disabled) return;
		setValue(val);
		if (historyIndex !== -1) setHistoryIndex(-1);
	}

	function handleSubmit(val: string) {
		if (disabled) return;
		setValue('');
		setHistoryIndex(-1);
		setDraft('');
		onSubmit(val);
	}

	return (
		<Box>
			<Text color="green">❯ </Text>
			{disabled ? (
				<Text dimColor>...</Text>
			) : (
				<TextInput value={value} onChange={handleChange} onSubmit={handleSubmit} />
			)}
		</Box>
	);
}
