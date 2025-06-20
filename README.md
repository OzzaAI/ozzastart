# Ozza Monorepo

This repository contains the source code for the Ozza platform.

## Prerequisites

This project uses `pnpm` as the package manager, managed via `corepack`. Before starting, ensure `pnpm` is activated by running the following commands:

```sh
corepack enable
corepack prepare pnpm@latest --activate
```

## Known Issues

### Husky hooks on Windows

The shell scripts used by Husky (e.g., in the `.husky/` directory) include the necessary executable permissions. There is no need to run `chmod` on them, even if you are working on a Windows machine. 