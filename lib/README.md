# Neutralino Process Runner

A Neutralino.js helper module to handle running background processes in a clean and fluent way. It supports running single process, sequentially executed processes (with piping) or concurrently executed processes.
Heavily inspired by Laravel Process.

## Installation

```bash
npm install neutralino-process-runner
```

## Usage

1. require into your project
`const Process = require('process-runner');`

2. Initialize the runner itself
`const processRunner = new Process('/path/to/working_directory');`

3. Run a simple single command
```javascript
const Process = require('process-runner');
const processRunner = new Process('/path/to/working_directory');

processRunner
  .setCommand(['ls', '-la']) 
  .run() 
  .then(({ stdOut, stdErr, exitCodes }) => {
    console.log(`exitCodes: ${exitCodes} stderr: ${stdErr} stdout: ${stdOut} `);
  })
  .finally((results) => {
    console.log("Process have finished successfully.");
  })
  .catch(error => {
    console.log("Error running process:", JSON.stringify(error));
  });
```

3.1 Explanation line by line

```javascript
const Process = require('process-runner');
const processRunner = new Process('/path/to/working_directory');

processRunner
  // Can also be a string, like: `setCommand('ls' '-la')`
  .setCommand(['ls', '-la']) 
  // run the command
  .run() 
  // then is runned unless an exception or exitCode happebs, then catch is runned instead
  .then(({ stdOut, stdErr, exitCodes }) => {
    console.log(`exitCodes: ${exitCodes} stderr: ${stdErr} stdout: ${stdOut} `); 
  })
  .finally((results) => {
    console.log("All processes have finished.");
  })
  .catch(error => {
    console.error("Error running process:", error);
  });
```

4. Run a chain of commands sequentially

```javascript
const Process = require('process-runner');
const processRunner = new Process('/path/to/working_directory');

processRunner
  .addCommand(['start.sh', 'dev'])
  .addCommand('second.js ci')
  .pipe()
  .then(({ stdOut, stdErr, exitCodes }) => {
    console.log("Final Output:", stdOut);
    console.log("Errors:", stdErr);
    console.log("Exit Codes:", exitCodes);
  })
  .finally((results) => {
    console.log("All processes have finished.");
  })
  .catch(error => {
    console.error("Error running process:", error);
  });

6. Run commands concurrently

```javascript
const processRunner = new Process('/path/to/working_directory');

processRunner
  .addCommand(['start.sh', 'dev'])
  .addCommand('second.js ci')
  .concurrently()
  .then((results) => {
    results.forEach((result) => {
      console.log(`Process ${result.id}: (${result.command})`);
      console.log("StdOut:", result.stdOut);
      console.log("StdErr:", result.stdErr);
      console.log("Exit Code:", result.exitCode);
    });
  })
  .finally(() => {
    console.log("All concurrent processes have finished.");
  })
  .catch(error => {
    console.error("Error running processes concurrently:", error);
  });
```
