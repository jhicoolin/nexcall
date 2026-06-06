import { rm } from 'node:fs/promises';

const modes = {
  dev: ['.next', '.next-fresh'],
  build: ['.next-build'],
  analyze: ['.next-build']
};

const requestedMode = process.argv[2];
const targets = modes[requestedMode] ?? ['.next', '.next-build', '.next-fresh'];

if (requestedMode && !modes[requestedMode]) {
  console.warn(`unknown cleanup mode ${requestedMode}; removing all targets`);
}

for (const target of targets) {
  try {
    await rm(target, { recursive: true, force: true });
    console.log(`removed ${target}`);
  } catch (error) {
    console.log(`skipped ${target}: ${error?.message ?? error}`);
  }
}
