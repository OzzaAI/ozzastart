import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../packages/db/migrations');
const FORBIDDEN_COMMANDS = ['DROP', 'TRUNCATE', 'RENAME', 'ALTER'];

function lintSqlFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR);
  let hasError = false;

  for (const file of files) {
    if (file.endsWith('.sql')) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8').toUpperCase();

      for (const command of FORBIDDEN_COMMANDS) {
        if (content.includes(command)) {
          console.error(`Error: Destructive command "${command}" found in ${file}`);
          hasError = true;
        }
      }
    }
  }

  if (hasError) {
    process.exit(1);
  } else {
    console.log('SQL linting passed. No destructive commands found.');
  }
}

lintSqlFiles(); 