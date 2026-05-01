import { describe, expect, test } from 'bun:test';
import { getMachineDisplayName } from './machine-name';

describe('getMachineDisplayName', () => {
	test('returns a non-empty name with no .local or .lan suffix', () => {
		const name = getMachineDisplayName();
		expect(name.length).toBeGreaterThan(0);
		expect(name).not.toMatch(/\.(local|lan)$/i);
	});
});
