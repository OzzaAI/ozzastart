const fs = require('fs');
const path = require('path');
const net = require('net');

const logFilePath = path.join(__dirname, '..', 'server_status.log');
const port = 3000; // Assuming Next.js dev server runs on port 3000

async function checkServerStatus() {
  let isProcessRunning = false;
  let isPortOpen = false;

  // Check if process is running
  if (fs.existsSync(logFilePath)) {
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    const pidMatch = logContent.match(/PID: (\d+)/);

    if (pidMatch && pidMatch[1]) {
      const pid = parseInt(pidMatch[1], 10);
      try {
        // Sending signal 0 checks if the process exists without killing it
        process.kill(pid, 0);
        isProcessRunning = true;
      } catch (err) {
        isProcessRunning = false;
      }
    }
  }

  // Check if port is open
  await new Promise(resolve => {
    const client = new net.Socket();
    client.setTimeout(1000); // 1 second timeout
    client.connect(port, '127.0.0.1', () => {
      isPortOpen = true;
      client.destroy();
      resolve();
    });
    client.on('error', () => {
      isPortOpen = false;
      client.destroy();
      resolve();
    });
    client.on('timeout', () => {
      isPortOpen = false;
      client.destroy();
      resolve();
    });
  });

  console.log(`Server Process Running: ${isProcessRunning}`);
  console.log(`Server Port ${port} Open: ${isPortOpen}`);

  if (isProcessRunning && isPortOpen) {
    console.log('Development server is running and accessible.');
  } else if (isProcessRunning && !isPortOpen) {
    console.log('Development server process is running, but port is not open. It might be starting up or encountering an issue.');
  } else if (!isProcessRunning && isPortOpen) {
    console.log('Port is open, but no associated process found. This is unusual.');
  } else {
    console.log('Development server is not running.');
  }
}

checkServerStatus();