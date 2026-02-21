# Timberlogs CLI

Official CLI for [Timberlogs](https://timberlogs.dev) — query logs, inspect flows, and view stats from your terminal.

## Quick Start

```bash
npm install -g timberlogs-cli
timberlogs login
timberlogs logs --level error --from 1h
```

## Commands

### Authentication

```bash
timberlogs login                    # Authenticate via browser (OAuth device flow)
timberlogs logout                   # Remove stored session
timberlogs whoami                   # Show current auth status
```

### Logs

```bash
timberlogs logs                          # Last hour of logs
timberlogs logs --level error --from 24h # Errors from last 24 hours
timberlogs logs --search "payment"       # Full-text search
timberlogs logs --source api-server      # Filter by source
timberlogs logs --flow-id checkout-abc   # Logs for a specific flow
```

| Flag | Description |
|------|-------------|
| `--level` | Filter by level (`debug`, `info`, `warn`, `error`) |
| `--source` | Filter by source name |
| `--env` | Filter by environment |
| `--search` | Full-text search (uses `/v1/logs/search`) |
| `--from` | Start time (`30m`, `1h`, `24h`, `7d`, or ISO 8601) |
| `--to` | End time |
| `--limit` | Max results (default: 50) |
| `--user-id` | Filter by user ID |
| `--session-id` | Filter by session ID |
| `--flow-id` | Filter by flow ID |
| `--dataset` | Filter by dataset |

Interactive mode: use arrow keys to navigate, Enter to expand a log, `q` to quit.

### Flows

```bash
timberlogs flows                        # List all flows
timberlogs flows --from 7d              # Flows from last 7 days
timberlogs flows show <flow-id>         # View flow timeline
timberlogs flows show checkout-abc      # Example
```

### Stats

```bash
timberlogs stats                         # Last 24 hours
timberlogs stats --from 7d              # Last 7 days
timberlogs stats --group-by source      # Group by source
```

| Flag | Description |
|------|-------------|
| `--from` | Start time (default: `24h`) |
| `--to` | End time |
| `--group-by` | Grouping: `hour`, `day`, `source` (default: `day`) |
| `--source` | Filter by source |
| `--env` | Filter by environment |
| `--dataset` | Filter by dataset |

### Config

```bash
timberlogs config list                   # Show current config
timberlogs config reset                  # Delete config file
```

## Global Flags

| Flag | Description |
|------|-------------|
| `--json` | Force JSON output |
| `--verbose` | Show HTTP request details |
| `--version`, `-v` | Show version |
| `--help`, `-h` | Show help |

## JSON Mode

All commands support `--json` for machine-readable output. JSON mode is also auto-detected when stdout is not a TTY (e.g., piped to another command).

```bash
# Explicit JSON mode
timberlogs logs --level error --json

# Auto-detected (piped)
timberlogs logs --level error | jq '.logs[].message'

# Use with AI agents
timberlogs logs --search "500 error" --json --from 1h
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NO_COLOR` | Disable color output |
| `TIMBERLOGS_CONFIG_DIR` | Custom config directory (default: `~/.config/timberlogs`) |

## Requirements

- Node.js >= 20

## License

MIT
