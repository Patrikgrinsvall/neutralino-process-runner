// lib/process-runner.js

class Process {
    constructor(workingDirectory = `${NL_CWD}`) {
        this.workingDirectory = workingDirectory;
        this.commands = [];
        this.processResults = [];
    }

    addCommand(command) {
        if (Array.isArray(command)) {
            this.commands.push(command.join(' '));
        } else {
            this.commands.push(command);
        }
        return this;
    }

    async _executeCommand(command, processId) {
        return new Promise((resolve, reject) => {
            let stdOut = '';
            let stdErr = '';
            let exitCode = null;

            Neutralino.os.spawnProcess(command, this.workingDirectory)
                .then(() => {
                    Neutralino.events.on('spawnedProcess', (evt) => {
                        switch (evt.detail.action) {
                            case 'stdOut':
                                stdOut += evt.detail.data;
                                break;
                            case 'stdErr':
                                stdErr += evt.detail.data;
                                break;
                            case 'exit':
                                exitCode = evt.detail.data;
                                const result = { stdOut, stdErr, exitCode, id: processId, command };
                                if (exitCode === 0) {
                                    resolve(result);
                                } else {
                                    reject(`Process exited with code: ${exitCode}`);
                                }
                                break;
                            default:
                                reject(`Unknown process event: ${evt.detail.action}`);
                        }
                    });
                })
                .catch(err => reject(`Failed to start process: ${err}`));
        });
    }

    async pipe() {
        if (this.commands.length === 0) {
            throw new Error('No commands to run');
        }

        for (let i = 0; i < this.commands.length; i++) {
            try {
                const result = await this._executeCommand(this.commands[i], i + 1);
                this.processResults.push(result);

                if (i < this.commands.length - 1) {
                    const nextCommand = this.commands[i + 1];
                    this.commands[i + 1] = `${nextCommand} ${result.stdOut.trim()}`;
                }
            } catch (error) {
                throw new Error(`Error in process ${i + 1}: ${error}`);
            }
        }

        return {
            stdOut: this.processResults.map(result => result.stdOut).join('\n'),
            stdErr: this.processResults.map(result => result.stdErr).join('\n'),
            exitCodes: this.processResults.map(result => result.exitCode),
        };
    }

    async concurrently() {
        if (this.commands.length === 0) {
            throw new Error('No commands to run');
        }

        const promises = this.commands.map((command, index) =>
            this._executeCommand(command, index + 1)
        );

        return Promise.allSettled(promises)
            .then((results) => {
                results.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        this.processResults.push(result.value);
                    } else {
                        console.error(`Error in process: ${result.reason}`);
                    }
                });

                return this.processResults.map(({ stdOut, stdErr, exitCode, id, command }) => ({
                    stdOut,
                    stdErr,
                    exitCode,
                    id,
                    command,
                }));
            });
    }

    finally(callback) {
        if (typeof callback === 'function') {
            callback(this.processResults);
        }
        return this;
    }
}

module.exports = Process;
