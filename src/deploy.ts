import { GitRepo } from "./git";
import { FTPClient } from "./ftp";
import { TaskQueue, foreachAsync } from "./lib";
import { ServerLog } from "./log";
import fs, { existsSync, readFileSync } from 'fs';
import Path from "path";
import { promisify } from "util";
import config from "../config/config"; 

let console: ServerLog;

export class ProjectDeploy
{
    git: GitRepo;
    ftp: FTPClient;
    taskQueue: TaskQueue;
    deployStatusPath: string = "./config/deploy.json";
    status: DeployStatus={lastDeployedCommit:""}
    constructor(serverLog: ServerLog)
    {
        console = serverLog;
        this.git = new GitRepo(config.git.path, config.git.repository, config.git.branch, serverLog);
        this.ftp = new FTPClient(config.ftp.address, config.ftp.username, config.ftp.password, serverLog);
        this.taskQueue = new TaskQueue(config.server.queueSize);
    }
    loadStatus()
    {
        if (!existsSync(this.deployStatusPath))
        {
            this.status = {
                lastDeployedCommit: ""
            };
            this.saveStatus();
        }
        else
        {
            this.status = JSON.parse(readFileSync(this.deployStatusPath).toString()) as DeployStatus;
        }
    }
    async saveStatus()
    {
        await promisify(fs.writeFile)(this.deployStatusPath, JSON.stringify(this.status, null, 4));
    }
    requestDeploy()
    {
        this.taskQueue.enqueue(() => this.deploy());
    }
    async setup()
    {
        this.taskQueue.on("error", (error) => console.error(`Task failed: ${error.message}`));
        await this.git.open();
        this.taskQueue.enqueue(() => this.deploy());
    }
    async deploy()
    {
        let id = await this.git.pull();
        let commit = await this.git.repo.getCommit(id);

        let lastCommit = this.status.lastDeployedCommit != "" ? await this.git.repo.getCommit(this.status.lastDeployedCommit) : null;
        let files = await this.git.getChangedFiles(await this.git.diff(commit, await lastCommit));
    
        await this.ftp.connect();
        await foreachAsync(files, async (file) =>
        {
            try
            {
                if (await promisify(fs.exists)(Path.resolve(this.git.path, file)))
                {
                    console.log(`Uploading [${file}]`);
                    await this.ftp.put(Path.resolve(this.git.path, file), Path.posix.join(config.ftp.folder, file));
                }
                else
                    console.warn(`Ingore [${file}]`);
            }
            catch (ex)
            {
                console.error(`Upload [${file}] failed: ${ex.message}`);
            }
        });
        this.ftp.close();
        this.status.lastDeployedCommit = id;
        await this.saveStatus();
        console.log("Deploy completed. ");
    }
}

interface DeployStatus
{
    lastDeployedCommit: string;
}