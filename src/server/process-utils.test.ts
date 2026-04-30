import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { canOpenMacApp, hasCommand, spawnDetached } from './process-utils';

describe('spawnDetached', () => {
	test('runs the command with args', async () => {
		const dir = mkdtempSync(path.join(tmpdir(), 'spawn-detached-'));
		const marker = path.join(dir, 'out');

		try {
			spawnDetached('sh', ['-c', `printf hello > ${marker}`]);
			for (let i = 0; i < 80; i++) {
				if (existsSync(marker)) break;
				await new Promise((r) => setTimeout(r, 25));
			}
			expect(readFileSync(marker, 'utf8')).toBe('hello');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe('hasCommand', () => {
	test('returns true for a command on PATH', () => {
		expect(hasCommand('sh')).toBe(true);
	});

	test('returns false for a missing command', () => {
		expect(hasCommand('definitely-not-a-real-command-xyz')).toBe(false);
	});
});

describe.skipIf(process.platform !== 'darwin')('canOpenMacApp', () => {
	test('returns true for a built-in mac app', () => {
		expect(canOpenMacApp('Finder')).toBe(true);
	});

	test('returns false for a missing app', () => {
		expect(canOpenMacApp('DefinitelyNotARealAppXyz')).toBe(false);
	});
});
