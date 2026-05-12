import process from 'node:process';

process.env.MIKO_RUNTIME_PROFILE = 'dev';
process.env.MIKO_DISABLE_SELF_UPDATE = '1';

await import('../src/server/cli');
