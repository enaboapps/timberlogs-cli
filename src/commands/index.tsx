import {Text, Box} from 'ink';

export default function Index() {
	return (
		<Box flexDirection="column">
			<Text bold>Timberlogs CLI v{CLI_VERSION}</Text>
			<Text> </Text>
			<Text>Usage: timberlogs {'<command>'} [options]</Text>
			<Text> </Text>
			<Text bold>Commands:</Text>
			<Text>  login              Store API key for authentication</Text>
			<Text>  logout             Remove stored API key</Text>
			<Text>  whoami             Show current auth status</Text>
			<Text>  logs               Query and search logs</Text>
			<Text>  flows show {'<id>'}    View a flow timeline</Text>
			<Text>  stats              Show log volume and distribution</Text>
			<Text>  config set         Set a config value</Text>
			<Text>  config list        Show current config</Text>
			<Text>  config reset       Delete config file</Text>
			<Text> </Text>
			<Text bold>Global Flags:</Text>
			<Text>  --json             Force JSON output</Text>
			<Text>  --api-key {'<key>'}    Override API key</Text>
			<Text>  --api-url {'<url>'}    Override API endpoint</Text>
			<Text>  --verbose          Show debug info</Text>
			<Text>  --version, -v      Show version</Text>
			<Text>  --help, -h         Show help</Text>
			<Text> </Text>
			<Text bold>Environment Variables:</Text>
			<Text>  TIMBER_API_KEY     API key (overrides config file)</Text>
			<Text>  TIMBER_API_URL     API endpoint (overrides config file)</Text>
			<Text>  NO_COLOR           Disable color output</Text>
		</Box>
	);
}
