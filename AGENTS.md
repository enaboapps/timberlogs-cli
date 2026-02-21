# AGENTS.md — Timberlogs CLI

## Project

Official CLI for [Timberlogs](https://timberlogs.dev). Binary name: `timberlogs`. Built with Ink 5 + Pastel + TypeScript.

- Repo: `enaboapps/timberlogs-cli`
- API: `https://timberlogs-ingest.enaboapps.workers.dev`
- Node: >= 20
- Package manager: pnpm

## Architecture

Pastel provides file-based routing for CLI commands. Each command file in `src/commands/` exports:
- `options` — Zod schema for flags (Pastel generates help text from `.describe()`)
- `args` — Zod tuple for positional arguments (optional)
- `default` — React component receiving `{args, options}` props

**Important:** Pastel requires **Zod v3**. Zod v4 is incompatible (breaks `_def.shape()` API).

### Directory Structure

```
src/
  cli.tsx                    # Pastel entry point
  commands/
    index.tsx                # Root help text (timberlogs)
    login.tsx                # timberlogs login
    logout.tsx               # timberlogs logout
    whoami.tsx               # timberlogs whoami
    logs.tsx                 # timberlogs logs
    stats.tsx                # timberlogs stats
    config/
      set.tsx                # timberlogs config set <key> <value>
      list.tsx               # timberlogs config list
      reset.tsx              # timberlogs config reset
    flows/
      show.tsx               # timberlogs flows show <flow-id>
  components/
    LogTable.tsx             # Interactive log table with keyboard nav
    LogDetail.tsx            # Expanded single log view
    FlowTimeline.tsx         # Flow step timeline
    StatsView.tsx            # Volume bars and level breakdown
  lib/
    api.ts                   # HTTP client (createApiClient)
    auth.ts                  # resolveApiKey, requireApiKey, maskApiKey
    config.ts                # Config file read/write at ~/.config/timberlogs/
    errors.ts                # CliError class, error codes, handleError
    output.ts                # isJsonMode, jsonOutput
    time.ts                  # parseRelativeTime, resolveApiUrl
  types/
    config.ts                # Config interface, DEFAULT_API_URL
    log.ts                   # LogEntry, LogsResponse interfaces
```

### Build

tsup with two configs:
1. `src/cli.tsx` — bundled with shebang (`#!/usr/bin/env node`)
2. Everything else — unbundled (`bundle: false`) to preserve directory structure for Pastel's runtime file scanning

```bash
pnpm build          # Build
pnpm dev            # Watch mode
```

## Patterns

### JSON Mode

Every command supports `--json`. In JSON mode:
- Return `null` from the React component (suppresses Ink rendering)
- Use `jsonOutput(data)` for success or `handleError(err, true)` for errors
- Both call `process.exit()` after writing to stdout
- Auto-detected when stdout is not a TTY (piped)

### Async Commands

Commands that make API calls use this pattern:
```tsx
export default function MyCommand({options}: Props) {
  const [data, setData] = useState(null);
  const json = isJsonMode(options);

  useEffect(() => { void fetchData(); }, []);

  async function fetchData() {
    try {
      // ... fetch ...
      if (json) { jsonOutput(response); }
      setData(response);
    } catch (err) {
      if (json) { handleError(err, true); }
      setError(err.message);
    }
  }

  if (json) { return null; }        // Suppress Ink output in JSON mode
  if (!data) { return <Loading />; }
  return <InteractiveView />;
}
```

### process.exit in React

Never call `process.exit()` in a render body — wrap in `useEffect` to avoid React warnings.

### Auth Resolution

API key precedence: `--api-key` flag > `TIMBER_API_KEY` env > config file.
API URL precedence: `--api-url` flag > `TIMBER_API_URL` env > config file > default.

## Git Workflow

- Default branch: `dev`
- Protected branches: `dev` and `main` (PRs required, enforced for admins)
- Branch naming: `feature/description-{issue#}`
- PRs target `dev`, squash merge
- Releases: merge `dev` → `main`

## Release Process

1. Bump version in `package.json` and `src/commands/index.tsx`
2. `pnpm build` to verify
3. Create release branch from `dev`
4. PR to `main` with merge commit
5. Tag `v{version}` on main
6. `npm publish`
7. Sync PR: `main` → `dev`

## Testing

No test framework yet. Verify with:
```bash
pnpm build
timberlogs --version
timberlogs --help
timberlogs logs --from 1h --limit 1 --json
timberlogs stats --json
timberlogs whoami --json
```

## Common Mistakes

- Installing `zod@4` — Pastel breaks. Always use `zod@3`.
- Calling `process.exit()` in render — use `useEffect`.
- Forgetting `bundle: false` in tsup for command files — Pastel can't find commands at runtime.
- Rendering Ink components in JSON mode — corrupts piped output with ANSI codes. Always `return null` early.
- Pushing directly to `dev` or `main` — branch protection requires PRs.
