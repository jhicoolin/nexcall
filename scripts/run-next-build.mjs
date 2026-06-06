import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const isVercel = Boolean(process.env.VERCEL);
const distDir = isVercel ? '.next' : '.next-build';
const nextBin = resolve('node_modules/next/dist/bin/next');

const result = spawnSync(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_DIST_DIR: distDir
  }
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
