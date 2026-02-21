import {Text, Box} from 'ink';

export default function Index() {
	return (
		<Box flexDirection="column">
			<Text bold>Timberlogs CLI v{CLI_VERSION}</Text>
			<Text> </Text>
			<Text>Usage: timberlogs {'<command>'} [options]</Text>
			<Text> </Text>
			<Text bold>Commands:</Text>
			<Text>  login              Authenticate via browser</Text>
			<Text>  logout             Remove stored session</Text>
			<Text>  whoami             Show current auth status</Text>
			<Text>  logs               Query and search logs</Text>
			<Text>  flows              List all flows</Text>
			<Text>  flows show {'<id>'}    View a flow timeline</Text>
			<Text>  stats              Show log volume and distribution</Text>
			<Text>  config list        Show current config</Text>
			<Text>  config reset       Delete config file</Text>
			<Text> </Text>
			<Text bold>Global Flags:</Text>
			<Text>  --json             Force JSON output</Text>
			<Text>  --verbose          Show debug info</Text>
			<Text>  --version, -v      Show version</Text>
			<Text>  --help, -h         Show help</Text>
		</Box>
	);
}
