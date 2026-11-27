import { spawnSync } from 'node:child_process';

const command = process.platform === 'win32' ? 'eslint.cmd' : 'eslint';
const result = spawnSync(command, ['.'], {
  cwd: process.cwd(),
  env: { ...process.env, ESLINT_USE_FLAT_CONFIG: 'false' },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
