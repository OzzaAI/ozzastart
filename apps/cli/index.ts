import 'dotenv/config';
import { Command } from 'commander';
import prompts from 'prompts';
import { migrate, resetDb, seedDb, createTenant } from './src/commands/index.js';

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('ozza-cli')
    .description('CLI for managing the Ozza platform')
    .version('0.1.0');

  program
    .command('db:migrate')
    .description('Run pending SQL migrations')
    .action(() => migrate());

  program
    .command('db:reset')
    .option('--force', 'Drop & recreate public schema')
    .action(opts => resetDb(opts.force));

  program
    .command('seed')
    .description('Seed initial plans, features, founder account')
    .action(() => seedDb());

  program
    .command('create-tenant <name>')
    .option('--owner <email>', 'Owner email')
    .action(async (name, opts) => {
      let ownerEmail = opts.owner;
      if (!ownerEmail) {
        const response = await prompts({
            type: 'text',
            name: 'email',
            message: 'Owner email:',
        });
        ownerEmail = response.email;
      }

      if (!ownerEmail) {
        console.error('Owner email is required.');
        process.exit(1);
      }

      await createTenant(name, ownerEmail);
    });

  await program.parseAsync(process.argv);
}

main().catch(err => {
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
  console.error('An unexpected error occurred:', err);
  process.exit(1);
}); 