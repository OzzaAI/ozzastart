# @ozza/cli

This package contains the command-line interface (CLI) for managing the Ozza platform's database and tenant lifecycle.

## Prerequisites

Before using the CLI, ensure you have a `.env` file in the root of the project with the following variables defined:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

For the `seed` command, you will also need:

```
FOUNDER_EMAIL=...
FOUNDER_PASSWORD=...
```

## Commands

You can run the CLI from the project root using `node apps/cli/dist/index.js <command>`.

---

### `db:migrate`

Applies all outstanding SQL migrations from the `supabase/migrations` directory to your Supabase database. This command ensures your database schema is up-to-date with the latest version defined in the codebase.

**Usage:**
```bash
node apps/cli/dist/index.js db:migrate
```

---

### `db:reset`

A destructive command that completely resets the database. It drops the `public` schema and all its tables, then reapplies all migrations from scratch.

**⚠️ Warning:** This command is intended for **development environments only**. To prevent accidental data loss, it will refuse to run unless `NODE_ENV` is set to `development`.

**Usage:**
```bash
# Must include the --force flag to execute
node apps/cli/dist/index.js db:reset --force
```

**Flags:**
* `--force`: **Required.** Confirms your intent to execute this destructive command.
* `--unsafe-prod`: Overrides the development environment check and allows the command to run in a production environment. Use with extreme caution.

---

### `seed`

Populates the database with essential initial data. This includes:
1. Creating the founder/platform admin user based on the `FOUNDER_EMAIL` and `FOUNDER_PASSWORD` in your `.env` file.
2. Creating the main "Ozza" platform account.
3. Assigning the founder user as the `owner` of the "Ozza" account.

**Usage:**
```bash
node apps/cli/dist/index.js seed
```

---

### `create-tenant`

Creates a new tenant, including their isolated database schema and default configuration.

**Usage:**
```bash
node apps/cli/dist/index.js create-tenant <account_name> [owner_email]
```

**Arguments:**
* `<account_name>`: (Required) The name for the new tenant account (e.g., "Acme Inc").
* `[owner_email]`: (Optional) The email address of an existing user to assign as the `owner` of this new account. If not provided, the account will be created as "orphaned." 