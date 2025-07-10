const fs = require('fs');
const path = 'C:/Dev/Ozza-Reboot/db/invite-tokens.ts';

fs.unlink(path, (err) => {
  if (err) {
    console.error(`Error deleting file: ${err}`);
  } else {
    console.log(`${path} deleted successfully.`);
  }
});