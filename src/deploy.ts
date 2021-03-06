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
    deployInfoPath: string = "./config/deploy.json";
    info: DeployInfo = { lastDeployedCommit: "", lastDeployTime:0 }
    status: "deploy" | "ready" | "error" = "ready";
    
    constructor(serverLog: ServerLog)
    {
        console = serverLog;
        this.git = new GitRepo(config.git.path, config.git.repository, config.git.branch, serverLog);
        this.ftp = new FTPClient(config.ftp.address, config.ftp.username, config.ftp.password, serverLog);
        this.taskQueue = new TaskQueue(config.server.queueSize);
        this.loadStatus();
    }
    loadStatus()
    {
        if (!existsSync(this.deployInfoPath))
        {
            this.info = {
                lastDeployedCommit: "",
                lastDeployTime: 0
            };
            this.saveStatus();
        }
        else
        {
            this.info = JSON.parse(readFileSync(this.deployInfoPath).toString()) as DeployInfo;
        }
    }
    async saveStatus()
    {
        await promisify(fs.writeFile)(this.deployInfoPath, JSON.stringify(this.info, null, 4));
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
        try
        {
            this.status = "deploy";
            console.log(`Start deployment.`);
            let id = await this.git.pull();
            console.log(`Update from ${this.info.lastDeployedCommit} to ${id}`);

            let commit = await this.git.getCommit(id);
            let lastCommit = await this.git.getCommit(this.info.lastDeployedCommit);

            let files = await this.git.getChangedFiles(await this.git.diff(commit, await lastCommit));
            console.log(`${files.length} files changed. `);
            let successCount = 0;
            let failedCount = 0;
            let ignoreCount = 0;
            await this.ftp.connect();
            await foreachAsync(files, async (file) =>
            {
                try
                {
                    if ((await promisify(fs.stat)(Path.resolve(this.git.path, file))).isDirectory())
                    {
                        console.log(`Making directory "${file}"`);
                        await this.ftp.mkdir(Path.posix.join(config.ftp.folder, file));
                        successCount++;
                        return;
                    }
                    if (await promisify(fs.exists)(Path.resolve(this.git.path, file)))
                    {
                        console.log(`Uploading "${file}"`);
                        await this.ftp.put(Path.resolve(this.git.path, file), Path.posix.join(config.ftp.folder, file));
                        successCount++;
                    }
                    else
                    {
                        ignoreCount++;
                        console.warn(`Ingore "${file}"`);
                    }
                }
                catch (ex)
                {
                    failedCount++;
                    console.error(`Upload "${file}" failed: ${ex.message}`);
                }
            });
            this.ftp.close();
            this.info.lastDeployedCommit = id;
            this.info.lastDeployTime = new Date().getTime();
            this.status = "ready";
            await this.saveStatus();
            console.log(`Deploy completed with ${successCount} uploaded, ${ignoreCount} ignored, ${failedCount} failed. `);
        }
        catch (ex)
        {
            console.error(`Deploy failed: ${ex.message}`);
            this.status = "error";
        }
    }
}

interface DeployInfo
{
    lastDeployedCommit: string;
    lastDeployTime: number;
}