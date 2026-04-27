import { describe, expect, test } from 'bun:test';
import {
	buildCommitMessagePrompt,
	fallbackSubject,
	generateCommitMessageDetailed,
	limitText,
	sanitizeSubject,
	summarizeFailures,
} from 'src/server/generate-commit-message';
import { QuickResponseAdapter } from 'src/server/quick-response';

describe('summarizeFailures', () => {
	test('returns null when there are no failures', () => {
		expect(summarizeFailures([])).toBeNull();
	});

	test('joins multiple failure reasons with "; "', () => {
		expect(
			summarizeFailures([
				{ provider: 'claude', reason: 'claude timed out' },
				{ provider: 'codex', reason: 'codex returned invalid json' },
			]),
		).toBe('claude timed out; codex returned invalid json');
	});
});

describe('limitText', () => {
	test('returns the input unchanged when within the limit', () => {
		expect(limitText('hello', 10)).toBe('hello');
	});

	test('truncates, trims trailing whitespace, and appends a marker when over the limit', () => {
		expect(limitText('abcdef   ghij', 9)).toBe('abcdef\n...[truncated]');
	});
});

describe('sanitizeSubject', () => {
	test('returns null for non-string input', () => {
		expect(sanitizeSubject(undefined)).toBeNull();
		expect(sanitizeSubject(42)).toBeNull();
	});

	test('returns null when the result is empty after normalization', () => {
		expect(sanitizeSubject('   \n  ')).toBeNull();
	});

	test('keeps only the first line, collapses whitespace, and strips trailing periods', () => {
		expect(sanitizeSubject('  fix   bug...\nmore details  ')).toBe('fix bug');
	});

	test('truncates to 72 characters', () => {
		expect(sanitizeSubject('a'.repeat(80))).toBe('a'.repeat(72));
	});
});

describe('fallbackSubject', () => {
	test('uses the basename of a single file path', () => {
		expect(
			fallbackSubject([{ path: 'src/server/foo.ts', changeType: 'modified', patch: '' }]),
		).toBe('Update foo.ts');
	});

	test('uses a count when there are multiple files', () => {
		expect(
			fallbackSubject([
				{ path: 'a.ts', changeType: 'modified', patch: '' },
				{ path: 'b.ts', changeType: 'added', patch: '' },
				{ path: 'c.ts', changeType: 'deleted', patch: '' },
			]),
		).toBe('Update 3 files');
	});
});

describe('buildCommitMessagePrompt', () => {
	test('includes the branch name and renders files with their change type and patches', () => {
		const prompt = buildCommitMessagePrompt({
			branchName: 'feature/login',
			files: [
				{ path: 'src/auth.ts', changeType: 'modified', patch: '@@ -1 +1 @@\n-old\n+new' },
				{ path: 'src/auth.test.ts', changeType: 'added', patch: '+ new test' },
			],
		});

		expect(prompt).toContain('Branch: feature/login');
		expect(prompt).toContain('modified: src/auth.ts');
		expect(prompt).toContain('added: src/auth.test.ts');
		expect(prompt).toContain('@@ -1 +1 @@\n-old\n+new');
		expect(prompt).toContain('+ new test');
	});

	test('falls back to "current branch" when no branch name is provided', () => {
		const prompt = buildCommitMessagePrompt({
			files: [{ path: 'a.ts', changeType: 'modified', patch: '' }],
		});

		expect(prompt).toContain('Branch: current branch');
	});
});

describe('generateCommitMessageDetailed', () => {
	test('returns the structured response when the adapter succeeds', async () => {
		const adapter = new QuickResponseAdapter({
			runClaudeStructured: async () => ({ subject: 'fix login bug.', body: '  details  ' }),
			runCodexStructured: async () => null,
		});

		const result = await generateCommitMessageDetailed(
			{ files: [{ path: 'src/auth.ts', changeType: 'modified', patch: 'patch' }] },
			adapter,
		);

		expect(result).toEqual({
			subject: 'fix login bug',
			body: 'details',
			usedFallback: false,
			failureMessage: null,
		});
	});

	test('falls back to a generated subject and summarizes failures when both providers return null', async () => {
		const adapter = new QuickResponseAdapter({
			runClaudeStructured: async () => null,
			runCodexStructured: async () => null,
		});

		const result = await generateCommitMessageDetailed(
			{ files: [{ path: 'src/server/foo.ts', changeType: 'modified', patch: '' }] },
			adapter,
		);

		expect(result.subject).toBe('Update foo.ts');
		expect(result.body).toBe('');
		expect(result.usedFallback).toBe(true);
		expect(result.failureMessage).toContain('claude');
		expect(result.failureMessage).toContain('codex');
	});
});
