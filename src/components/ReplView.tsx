import {Box, Text} from 'ink';
import {useState, useEffect, useCallback} from 'react';
import type {ReactNode} from 'react';
import {loadHistory, saveHistory} from '../lib/history.js';
import {parseReplInput} from '../lib/replParser.js';
import {parseFlags} from '../lib/flagParser.js';
import {resolveToken} from '../lib/auth.js';
import {createApiClient} from '../lib/api.js';
import {readConfig, writeConfig, deleteConfig} from '../lib/config.js';
import {options as logsOptions} from '../commands/logs.js';
import {options as statsOptions} from '../commands/stats.js';
import {options as flowsOptions} from '../commands/flows/index.js';
import {options as flowShowOptions} from '../commands/flows/show.js';
import ReplOutput from './ReplOutput.js';
import ReplPrompt from './ReplPrompt.js';
import WhoamiView from './commandViews/WhoamiView.js';
import FlowsView from './commandViews/FlowsView.js';
import StatsViewCmd from './commandViews/StatsViewCmd.js';
import LogsView from './commandViews/LogsView.js';
import FlowShowView from './commandViews/FlowShowView.js';
import LoginView from './commandViews/LoginView.js';
import type {ReplEntry} from './ReplOutput.js';

const COMMANDS_HINT = 'logs  stats  flows  flows show  whoami  login  logout  config list  help  exit';

function ReplHeader({token, orgName}: {token: string | null; orgName: string | null}) {
	const cols = process.stdout.columns || 80;
	return (
		<Box flexDirection="column">
			<Box gap={2}>
				<Box gap={1}>
					<Text bold color="green">▲</Text>
					<Text bold>Timberlogs</Text>
					<Text dimColor>v{CLI_VERSION}</Text>
				</Box>
				{token ? (
					<Text><Text color="green">● </Text><Text>{orgName ?? 'Authenticated'}</Text></Text>
				) : (
					<Text><Text color="red">● </Text><Text dimColor>Not logged in</Text></Text>
				)}
			</Box>
			<Text dimColor>{COMMANDS_HINT}</Text>
			<Text dimColor>{'─'.repeat(Math.min(cols, 60))}</Text>
		</Box>
	);
}

type Phase =
	| {tag: 'idle'}
	| {tag: 'running'; node: ReactNode}
	| {tag: 'interactive'; node: ReactNode};

const MAX_ENTRIES = 200;

const HELP_LINES = [
	'Commands:',
	'  logs [flags]             Query and search logs',
	'  stats [flags]            Show log volume and stats',
	'  flows [flags]            List flows',
	'  flows show <id>          View a flow timeline',
	'  whoami                   Show auth status',
	'  login                    Authenticate via browser',
	'  logout                   Remove stored session',
	'  config list              Show config',
	'  config reset [--force]   Reset config',
	'',
	'Builtins: help, clear, exit',
	'History: ↑↓ navigate',
];

export default function ReplView() {
	const [entries, setEntries] = useState<ReplEntry[]>([]);
	const [phase, setPhase] = useState<Phase>({tag: 'idle'});
	const [history, setHistory] = useState<string[]>([]);
	const [token, setToken] = useState<string | null>(null);
	const [orgName, setOrgName] = useState<string | null>(null);

	const fetchOrgName = useCallback(async (t: string) => {
		try {
			const client = createApiClient({token: t});
			const whoami = await client.get<{organizationName?: string}>('/v1/whoami');
			if (whoami.organizationName) setOrgName(whoami.organizationName);
		} catch {
			// silently fail — header shows "Authenticated" fallback
		}
	}, []);

	useEffect(() => {
		setHistory(loadHistory());
		setToken(resolveToken());
	}, []);

	useEffect(() => {
		if (!token) { setOrgName(null); return; }
		void fetchOrgName(token);
	}, [token]);

	function addEntry(entry: ReplEntry) {
		setEntries(prev => [...prev, entry].slice(-MAX_ENTRIES));
	}

	function handleSubmit(input: string) {
		const trimmed = input.trim();
		if (!trimmed) return;

		const newHistory = history[history.length - 1] === trimmed
			? history
			: [...history, trimmed];
		setHistory(newHistory);
		saveHistory(newHistory);

		const parsed = parseReplInput(trimmed);

		if (parsed.type === 'empty') return;

		addEntry({kind: 'command', input: trimmed});

		if (parsed.type === 'builtin') {
			handleBuiltin(parsed.name);
			return;
		}

		if (parsed.type === 'unknown') {
			addEntry({kind: 'error', message: `Unknown command: ${parsed.input}. Type "help" for available commands.`});
			return;
		}

		dispatch(parsed.name, parsed.tokens);
	}

	function handleBuiltin(name: 'help' | 'exit' | 'clear') {
		if (name === 'clear') {
			setEntries([]);
			return;
		}

		if (name === 'exit') {
			process.exit(0);
		}

		addEntry({
			kind: 'output',
			content: (
				<Box flexDirection="column">
					{HELP_LINES.map((line, i) => (
						<Text key={i} dimColor={!line.startsWith('Commands') && line !== ''}>{line}</Text>
					))}
				</Box>
			),
		});
	}

	function dispatch(name: string, tokens: string[]) {
		const onDone = (output: ReactNode, interactive: boolean) => {
			const newToken = resolveToken();
			setToken(newToken);
			if (interactive) {
				setPhase({tag: 'interactive', node: output});
			} else {
				if (output !== null) {
					addEntry({kind: 'output', content: output});
				}
				setPhase({tag: 'idle'});
			}
		};

		const onError = (message: string) => {
			setToken(resolveToken());
			addEntry({kind: 'error', message});
			setPhase({tag: 'idle'});
		};

		const onBack = () => setPhase({tag: 'idle'});

		if (name === 'login') {
			setPhase({tag: 'running', node: <LoginView onDone={onDone} onError={onError} />});
			return;
		}

		if (name === 'logout') {
			const config = readConfig();
			if (config.sessionToken) {
				delete config.sessionToken;
				writeConfig(config);
				setToken(null);
				addEntry({kind: 'output', content: <Text color="green">✓ Logged out</Text>});
			} else {
				addEntry({kind: 'output', content: <Text color="yellow">Not logged in</Text>});
			}

			return;
		}

		if (name === 'config list') {
			const config = readConfig();
			addEntry({
				kind: 'output',
				content: (
					<Text>
						<Text bold>{'Authenticated:  '}</Text>
						<Text color={config.sessionToken ? 'green' : 'red'}>
							{config.sessionToken ? 'Yes' : 'No'}
						</Text>
					</Text>
				),
			});
			return;
		}

		if (name === 'config reset') {
			if (!tokens.includes('--force')) {
				addEntry({kind: 'error', message: 'Use `config reset --force` to confirm.'});
				return;
			}

			deleteConfig();
			setToken(null);
			addEntry({kind: 'output', content: <Text color="green">✓ Config reset successfully</Text>});
			return;
		}

		if (!token) {
			addEntry({kind: 'error', message: 'Not authenticated. Run `login` to get started.'});
			return;
		}

		if (name === 'whoami') {
			setPhase({tag: 'running', node: <WhoamiView token={token} onDone={onDone} onError={onError} />});
			return;
		}

		if (name === 'logs') {
			const result = parseFlags(tokens, logsOptions);
			if (result.error) { addEntry({kind: 'error', message: result.error}); return; }
			const flags = result.flags as Parameters<typeof LogsView>[0]['flags'];
			setPhase({tag: 'running', node: <LogsView flags={flags} token={token} onBack={onBack} onDone={onDone} onError={onError} />});
			return;
		}

		if (name === 'stats') {
			const result = parseFlags(tokens, statsOptions);
			if (result.error) { addEntry({kind: 'error', message: result.error}); return; }
			const flags = result.flags as Parameters<typeof StatsViewCmd>[0]['flags'];
			setPhase({tag: 'running', node: <StatsViewCmd flags={flags} token={token} onBack={onBack} onDone={onDone} onError={onError} />});
			return;
		}

		if (name === 'flows') {
			const result = parseFlags(tokens, flowsOptions);
			if (result.error) { addEntry({kind: 'error', message: result.error}); return; }
			const flags = result.flags as Parameters<typeof FlowsView>[0]['flags'];
			setPhase({tag: 'running', node: <FlowsView flags={flags} token={token} onDone={onDone} onError={onError} />});
			return;
		}

		if (name === 'flows show') {
			const result = parseFlags(tokens, flowShowOptions);
			if (result.error) { addEntry({kind: 'error', message: result.error}); return; }
			const flowId = result.positional[0];
			if (!flowId) {
				addEntry({kind: 'error', message: 'Usage: flows show <flow-id>'});
				return;
			}

			setPhase({tag: 'running', node: <FlowShowView flowId={flowId} token={token} onBack={onBack} onDone={onDone} onError={onError} />});
			return;
		}
	}

	if (phase.tag === 'interactive') {
		return <>{phase.node}</>;
	}

	const rows = process.stdout.rows || 24;
	const visibleEntries = entries.slice(-(rows - 3));

	return (
		<Box flexDirection="column">
			<ReplHeader token={token} orgName={orgName} />
			{visibleEntries.map((entry, i) => (
				<ReplOutput key={i} entry={entry} />
			))}
			{phase.tag === 'running' && phase.node}
			<ReplPrompt history={history} onSubmit={handleSubmit} disabled={phase.tag === 'running'} />
		</Box>
	);
}
