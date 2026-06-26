# pi-landstrip

`pi-landstrip` is an extension for [pi](https://pi.dev/) providing a sandbox
defined with a policy compatible with Anthropic's JSON format. It uses
[`landstrip`](https://github.com/landstrip/landstrip) to implement the sandbox.

`pi-landstrip` has a default policy [sandbox.json](./sandbox.json), and allows
the define either or both global or project specific policies.

## Installing the extension

### Automatic install

```
pi install npm:pi-landstrip
```

This installs `pi-landstrip` and its `@landstrip/landstrip` dependency, which
includes platform-specific native binaries for Linux, macOS, and Windows.

### Manual install

Add the extension to `~/.pi/agent/settings.json` (global) or
`.pi/settings.json` (project):

```json
{
  "packages": ["npm:pi-landstrip"]
}
```

Alternatively, drop the extension under `~/.pi/agent/extensions/` (global) or
`.pi/extensions/` (project). See the pi
[extensions](https://pi.dev/docs/latest/extensions) documentation for details.

On unsupported platforms the extension loads but leaves sandboxing disabled.

## Disable

Use the `--no-sandbox` flag, or set `enabled` to `false` in the sandbox
config:

```json
{
  "enabled": false
}
```

Project config overrides global config. The `/sandbox` UI updates the project
config when present, otherwise the global config.

## Behavior

When pi asks for a sandboxed permission, the extension emits a host
notification. After that the extension opens a dialog with the choices to allow
for the session, persist for the project, persist globally, or reject. The dialog shows the exact path or domain being approved.

Project approvals are written to `.pi/sandbox.json`; global approvals are
written to `~/.pi/agent/sandbox.json`.

When pi runs a bash command, the extension wraps it in `landstrip`. This
applies to both the AI `bash` tool calls and manually typed shell-mode commands
(`!` and `!!`). Network traffic is routed through an allowlist proxy when
network access is off. If a command discovers a domain only at runtime, the
proxy can prompt interactively before allowing or denying the connection.
Read/write tool access is blocked outside the configured filesystem allowlists.
The default policy is strict: network access is off unless domains are allowed,
reads are limited to the project, `~/.gitconfig`, and `/dev/null`, and writes
are limited to the project and `/dev/null`.

Use `/sandbox` inside pi to show the active config and toggle sandboxing.

## Audit logging

Audit logging is disabled by default. Enable it with sandbox config:

```json
{
  "audit": {
    "enabled": true,
    "logPath": "~/.pi/agent/sandbox-audit.jsonl",
    "includeCommands": false
  }
}
```

You can also set `PI_LANDSTRIP_AUDIT_LOG=/path/to/audit.jsonl` for temporary
logging. Audit entries are JSON Lines and include sandbox decisions such as bash
start/end and filesystem prompt decisions. Commands are omitted unless
`includeCommands` is true.

## License

`pi-landstrip` is licensed under `MIT`. See [LICENSE](LICENSE) for more
information.

The bundled `@landstrip/landstrip` package is licensed separately as
`Apache-2.0 AND LGPL-2.1-or-later`.
