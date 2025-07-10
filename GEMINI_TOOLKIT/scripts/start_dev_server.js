const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '..', 'server_status.log');
const stdoutLogPath = path.join(__dirname, '..', 'dev_server_stdout.log');
const stderrLogPath = path.join(__dirname, '..', 'dev_server_stderr.log');

// Clear previous logs
if (fs.existsSync(stdoutLogPath)) fs.unlinkSync(stdoutLogPath);
if (fs.existsSync(stderrLogPath)) fs.unlinkSync(stderrLogPath);

const stdoutStream = fs.openSync(stdoutLogPath, 'a');
const stderrStream = fs.openSync(stderrLogPath, 'a');

const serverProcess = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev'], {
  cwd: path.join(__dirname, '..', '..'), // Ozza-Reboot directory
  detached: true, // Detach the child process
  stdio: ['ignore', stdoutStream, stderrStream], // Redirect stdout and stderr to files
});

serverProcess.unref(); // Allow the parent to exit independently

const status = `Server started with PID: ${serverProcess.pid} at ${new Date().toISOString()}\nstdout_log: ${stdoutLogPath}\nstderr_log: ${stderrLogPath}\n`;
fs.writeFileSync(logFilePath, status);

console.log(`Development server started in background. PID: ${serverProcess.pid}`);
console.log(`Stdout logged to ${stdoutLogPath}`);
console.log(`Stderr logged to ${stderrLogPath}`);
console.log(`Status logged to ${logFilePath}`);