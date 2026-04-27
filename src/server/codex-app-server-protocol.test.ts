import { describe, expect, test } from 'bun:test';
import {
	isJsonRpcResponse,
	isServerNotification,
	isServerRequest,
} from './codex-app-server-protocol';

describe('isJsonRpcResponse', () => {
	test('accepts a success response with id and result', () => {
		expect(isJsonRpcResponse({ id: 1, result: { ok: true } })).toBe(true);
	});

	test('accepts an error response with id and error', () => {
		expect(isJsonRpcResponse({ id: 'abc', error: { code: -32601, message: 'oops' } })).toBe(true);
	});

	test('accepts a string id', () => {
		expect(isJsonRpcResponse({ id: 'req-1', result: null })).toBe(true);
	});

	test('rejects a request that also has a method field', () => {
		expect(isJsonRpcResponse({ id: 1, method: 'item/tool/call', params: {} })).toBe(false);
	});

	test('rejects a notification with no id', () => {
		expect(isJsonRpcResponse({ method: 'turn/started', params: {} })).toBe(false);
	});

	test('rejects an object missing both result and error', () => {
		expect(isJsonRpcResponse({ id: 1 })).toBe(false);
	});

	test('rejects null', () => {
		expect(isJsonRpcResponse(null)).toBe(false);
	});

	test('rejects non-object primitives', () => {
		expect(isJsonRpcResponse('string')).toBe(false);
		expect(isJsonRpcResponse(42)).toBe(false);
		expect(isJsonRpcResponse(undefined)).toBe(false);
	});
});

describe('isServerRequest', () => {
	test('accepts item/tool/requestUserInput', () => {
		expect(
			isServerRequest({
				id: 1,
				method: 'item/tool/requestUserInput',
				params: { threadId: 't', turnId: 'u', itemId: 'i', questions: [] },
			}),
		).toBe(true);
	});

	test('accepts item/tool/call', () => {
		expect(
			isServerRequest({
				id: 2,
				method: 'item/tool/call',
				params: {
					threadId: 't',
					turnId: 'u',
					callId: 'c',
					tool: 'miko.demo',
					arguments: {},
				},
			}),
		).toBe(true);
	});

	test('accepts item/commandExecution/requestApproval', () => {
		expect(
			isServerRequest({
				id: 3,
				method: 'item/commandExecution/requestApproval',
				params: { threadId: 't', turnId: 'u', itemId: 'i' },
			}),
		).toBe(true);
	});

	test('accepts item/fileChange/requestApproval', () => {
		expect(
			isServerRequest({
				id: 4,
				method: 'item/fileChange/requestApproval',
				params: { threadId: 't', turnId: 'u', itemId: 'i' },
			}),
		).toBe(true);
	});

	test('rejects a notification missing id', () => {
		expect(isServerRequest({ method: 'item/tool/call', params: {} })).toBe(false);
	});

	test('rejects an unknown method even with an id', () => {
		expect(isServerRequest({ id: 1, method: 'item/tool/unknown', params: {} })).toBe(false);
	});

	test('rejects a response (no method field)', () => {
		expect(isServerRequest({ id: 1, result: {} })).toBe(false);
	});

	test('rejects a non-string method', () => {
		expect(isServerRequest({ id: 1, method: 42, params: {} })).toBe(false);
	});

	test('rejects null and primitives', () => {
		expect(isServerRequest(null)).toBe(false);
		expect(isServerRequest('item/tool/call')).toBe(false);
	});
});

describe('isServerNotification', () => {
	test('accepts thread/started', () => {
		expect(
			isServerNotification({ method: 'thread/started', params: { thread: { id: 't' } } }),
		).toBe(true);
	});

	test('accepts turn/started', () => {
		expect(
			isServerNotification({
				method: 'turn/started',
				params: { threadId: 't', turn: { id: 'u', status: 'inProgress', error: null } },
			}),
		).toBe(true);
	});

	test('accepts item/plan/delta', () => {
		expect(
			isServerNotification({
				method: 'item/plan/delta',
				params: { threadId: 't', turnId: 'u', itemId: 'i', delta: 'hi' },
			}),
		).toBe(true);
	});

	test('accepts thread/compacted', () => {
		expect(
			isServerNotification({
				method: 'thread/compacted',
				params: { threadId: 't', turnId: 'u' },
			}),
		).toBe(true);
	});

	test('accepts error notification', () => {
		expect(
			isServerNotification({
				method: 'error',
				params: { error: { message: 'boom' }, willRetry: false },
			}),
		).toBe(true);
	});

	test('rejects a request that carries an id', () => {
		expect(isServerNotification({ id: 1, method: 'turn/started', params: {} })).toBe(false);
	});

	test('rejects an unknown method', () => {
		expect(isServerNotification({ method: 'thread/unknown', params: {} })).toBe(false);
	});

	test('rejects a response (no method field)', () => {
		expect(isServerNotification({ id: 1, result: {} })).toBe(false);
	});

	test('rejects null and primitives', () => {
		expect(isServerNotification(null)).toBe(false);
		expect(isServerNotification('turn/started')).toBe(false);
	});
});
