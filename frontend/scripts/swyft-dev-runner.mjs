import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { join } from "node:path";

const log = createWriteStream(join(import.meta.dirname, "..", "swyft-dev-runner.log"), {
  flags: "a",
});

const child = spawn(
  process.execPath,
  ["./node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3000"],
  {
    cwd: new URL("..", import.meta.url),
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  },
);

child.stdin.write("\n");
child.stdout.pipe(log);
child.stderr.pipe(log);

child.on("exit", (code) => {
  log.write(`\nnext exited with code ${code}\n`);
  process.exitCode = code ?? 0;
});

setInterval(() => {
  if (child.killed) {
    process.exit(process.exitCode ?? 0);
  }
}, 1000);
