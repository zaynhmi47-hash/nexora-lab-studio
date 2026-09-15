import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const mobilePackage = 'nexora-muslim-mobile';

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    console.error(`\nFailed to run ${command}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync('pnpm-workspace.yaml')) {
  console.error('Run this command from the Nexora monorepo root.');
  process.exit(1);
}

console.log('Nexora Muslim — bootstrap');
console.log('Installing workspace dependencies...');
run(pnpm, ['install']);

console.log('\nStarting Expo for Nexora Muslim...');
const child = spawn(
  pnpm,
  ['--filter', mobilePackage, 'start'],
  {
    stdio: 'inherit',
    shell: false,
  },
);

child.on('error', (error) => {
  console.error(`\nFailed to start Expo: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
