# Gemini's Toolkit for Ozza-Reboot

This directory serves as a self-maintained toolkit for the Gemini CLI agent, designed to streamline development workflows and emulate the user's problem-solving approach.

## Derived Thought Process & Problem-Solving Methodology

Based on our interactions, my problem-solving methodology can be summarized as an iterative, context-aware, and diagnostic loop:

1.  **Understand the Goal:** Clearly define the user's high-level objective (e.g., "fix bug X," "implement feature Y").
2.  **Initial Assessment & Context Gathering:**
    *   Read relevant files (`read_file`, `read_many_files`).
    *   List directory contents (`list_directory`).
    *   Search for patterns (`search_file_content`, `glob`).
    *   Check existing configurations (e.g., `package.json`, `.env`).
    *   Identify potential areas of impact.
3.  **Formulate a Plan:** Develop a step-by-step approach to achieve the goal, anticipating potential issues.
4.  **Execute & Monitor:** Run commands (`run_shell_command`) or perform file modifications (`write_file`, `replace`). Closely monitor output for success, errors, or unexpected behavior.
5.  **Diagnose & Debug (Iterative Loop):**
    *   **Error Analysis:** If an error occurs, interpret its nature (e.g., syntax error, runtime error, network issue, permission denied, 404, 500).
    *   **Hypothesis Generation:** Formulate theories about the root cause.
    *   **Information Gathering:** Use tools to gather more data (e.g., add `console.log` statements, check server status, inspect logs).
    *   **Refine & Retry:** Adjust the plan based on new insights and re-execute.
6.  **Verify & Confirm:** After implementing changes, verify that the solution works as expected (e.g., run tests, check application behavior, confirm with the user).
7.  **Refactor & Clean Up (if necessary):** Improve code quality, remove temporary files/logs, and ensure adherence to project conventions.

## Toolkit Components

### `scripts/`

This directory will contain reusable scripts to automate common development and debugging tasks. Examples include:
*   `reset_database.js`: For clearing and re-initializing the development database.
*   `delete_next_dir.js`: For clearing the Next.js build cache.

### Virtual Terminal Management

While I cannot literally "spin up" new, independent, interactive terminal sessions, I can emulate this capability by managing background processes and their output. The following scripts facilitate this:

*   `start_dev_server.js`: Starts the `npm run dev` server in the background, detaching it from the current process and redirecting its stdout and stderr to `dev_server_stdout.log` and `dev_server_stderr.log` respectively. It also logs the process ID (PID).
*   `stop_dev_server.js`: Gracefully terminates the background `npm run dev` server process using its recorded PID.
*   `check_dev_server_status.js`: Verifies if the `npm run dev` server process is running and if its associated port (3000) is open.
*   `read_dev_server_logs.js`: Reads and displays the content of `dev_server_stdout.log` and `dev_server_stderr.log`, providing insight into the background server's output.

These scripts allow me to:
*   **Manage long-running processes:** Start and stop the development server as needed without blocking my execution.
*   **Monitor process status:** Check if a background process is active and responsive.
*   **Capture and analyze output:** By redirecting stdout and stderr to log files, I can effectively "see" the output of the background server, enabling better debugging and monitoring.

### `config/`

This directory will store configuration files that can be used by scripts or referenced during development.

## How I Will Use This Toolkit

*   **Proactive Problem Solving:** When faced with common issues (like build errors or database inconsistencies), I will proactively suggest and execute relevant scripts from this toolkit.
*   **Contextual Application:** I will use the `README.md` as a guide to my own thought process, ensuring I apply a consistent and effective problem-solving methodology.
*   **Self-Improvement:** As we encounter new patterns or develop new solutions, I will update this `README.md` and add new scripts/configurations to the toolkit, continuously enhancing my capabilities.