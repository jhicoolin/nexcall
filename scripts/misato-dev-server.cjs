const { spawn } = require("node:child_process");

const port = process.env.PORT || "3010";
const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", "--port", port], {
  stdio: "inherit",
  shell: false,
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: port,
    HOSTNAME: process.env.HOSTNAME || "127.0.0.1"
  }
});

const exit = (code) => process.exit(code ?? 0);

child.on("exit", exit);
child.on("error", (error) => {
  console.error(error);
  exit(1);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
