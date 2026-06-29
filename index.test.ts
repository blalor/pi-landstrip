// SPDX-License-Identifier: MIT
// Copyright (C) Jarkko Sakkinen 2026

import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  getSandboxDisableReason,
  matchesPattern,
  parseSandboxSessionCommand,
  shouldPromptForWrite,
} from './index.ts';

// The broker resolves relative policy entries (notably ".") against the command
// `cwd` that landstrip uses as its policy base. Regression guard: before the fix
// these resolved against the extension process's own `process.cwd()`, so a write
// inside the project was wrongly judged outside allowWrite whenever pi was
// launched from a different directory. Every project path below is deliberately
// NOT process.cwd(), so a process.cwd()-based resolution would fail these.
const PROJECT = '/proj/workspace';

describe('matchesPattern "." resolves against the command cwd', () => {
  it('matches a path inside the cwd', () => {
    expect(matchesPattern(`${PROJECT}/src/file.ts`, ['.'], PROJECT)).toBe(true);
  });

  it('matches the cwd itself', () => {
    expect(matchesPattern(PROJECT, ['.'], PROJECT)).toBe(true);
  });

  it('does not match a path outside the cwd', () => {
    expect(matchesPattern('/other/place/file.ts', ['.'], PROJECT)).toBe(false);
  });

  it('is independent of process.cwd()', () => {
    // process.cwd() is the repo root here, never PROJECT.
    expect(process.cwd()).not.toBe(PROJECT);
    expect(matchesPattern(`${PROJECT}/x`, ['.'], PROJECT)).toBe(true);
    expect(matchesPattern(`${process.cwd()}/x`, ['.'], PROJECT)).toBe(false);
  });
});

describe('matchesPattern other entry shapes', () => {
  it('expands ~ against the home directory regardless of cwd', () => {
    expect(matchesPattern(join(homedir(), '.gitconfig'), ['~/.gitconfig'], PROJECT)).toBe(true);
  });

  it('honours absolute entries regardless of cwd', () => {
    expect(matchesPattern('/dev/null', ['/dev/null'], PROJECT)).toBe(true);
  });

  it('matches globs', () => {
    expect(matchesPattern(`${PROJECT}/a/b/.env`, ['**/.env'], PROJECT)).toBe(true);
    expect(matchesPattern(`${PROJECT}/a/b/key.pem`, ['**/*.pem'], PROJECT)).toBe(true);
    expect(matchesPattern(`${PROJECT}/a/b/file.ts`, ['**/.env'], PROJECT)).toBe(false);
  });
});

describe('shouldPromptForWrite', () => {
  it('does not prompt for a path inside an allowWrite "." root', () => {
    expect(shouldPromptForWrite(`${PROJECT}/out.txt`, ['.'], PROJECT)).toBe(false);
  });

  it('prompts for a path outside allowWrite', () => {
    expect(shouldPromptForWrite('/other/out.txt', ['.'], PROJECT)).toBe(true);
  });

  it('prompts when allowWrite is empty', () => {
    expect(shouldPromptForWrite(`${PROJECT}/out.txt`, [], PROJECT)).toBe(true);
  });
});

describe('session sandbox disable state', () => {
  it('prefers the CLI flag over the session switch', () => {
    expect(getSandboxDisableReason(true, false)).toBe('flag');
    expect(getSandboxDisableReason(true, true)).toBe('flag');
  });

  it('uses the session switch without requiring persisted config changes', () => {
    expect(getSandboxDisableReason(false, true)).toBe('session');
    expect(getSandboxDisableReason(false, false)).toBeNull();
  });

  it('parses explicit session commands', () => {
    expect(parseSandboxSessionCommand('session off')).toBe('disable');
    expect(parseSandboxSessionCommand(' session   disable ')).toBe('disable');
    expect(parseSandboxSessionCommand('session on')).toBe('enable');
    expect(parseSandboxSessionCommand('session enable')).toBe('enable');
    expect(parseSandboxSessionCommand('session toggle')).toBe('toggle');
    expect(parseSandboxSessionCommand('off')).toBeNull();
  });
});
