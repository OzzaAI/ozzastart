const fs = require('fs');
const path = require('path');
const process = require('process');

const logFilePath = path.join(__dirname, '..', 'server_status.log');

if (fs.existsSync(logFilePath)) {
  const logContent = fs.readFileSync(logFilePath, 'utf8');
  const pidMatch = logContent.match(/PID: (\d+)/);

  if (pidMatch && pidMatch[1]) {
    const pid = parseInt(pidMatch[1], 10);
    try {
      process.kill(pid, 'SIGTERM'); // Attempt to gracefully terminate
      console.log(`Attempted to stop process with PID: ${pid}`);
      fs.unlinkSync(logFilePath); // Remove the log file
    } catch (err) {
      console.error(`Error stopping process with PID ${pid}: ${err.message}`);
    }
  } else {
    console.log('No PID found in log file.');
  }
} else {
  console.log('Server status log file not found.');
}