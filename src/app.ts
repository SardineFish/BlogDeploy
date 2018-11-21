import http from "http";
import Koa from "koa";
import Router from "koa-router";
import config from "../config/config";
import { Push,  } from "github-webhook-event-types";
import koaBody = require("koa-body");
import Git from "nodegit";
import { GitRepo } from "./git";
import { FTPClient } from "./ftp";
import { PromiseSchedule, foreachAsync } from "./lib";
import fs from "fs";
import { promisify } from "util";
import Path from "path";
import { ServerLog } from "./log";

const app = new Koa();
const router = new Router();
const serverLog = new ServerLog(config.server.log);
const git = new GitRepo(config.git.path, config.git.repository, config.git.branch, serverLog);
const ftp = new FTPClient(config.ftp.address, config.ftp.username, config.ftp.password, serverLog);
router
    .post("/update", (ctx, next) =>
    {
        ctx.response.status = 200;
        console.log(ctx.request.headers);
    });

setup();
async function setup()
{
    await ftp.connect();
    await git.open();
    await deploy();
    app
        .use(koaBody())
        .use(router.routes())
        .use(router.allowedMethods())
        .listen(config.server.port, config.server.host);
}

async function deploy()
{
    let files = await git.pull();
    await foreachAsync(files, async (file) =>
    {
        try
        {
            if (await promisify(fs.exists)(Path.resolve(git.path, file)))
            {
                serverLog.log(`Uploading ${file}`);
                await ftp.put(Path.resolve(git.path, file), Path.posix.join(config.ftp.folder, file));
            }
            else
                serverLog.warn(`Ingore ${file}`);
        }
        catch (ex)
        {
            serverLog.error(`Upload ${file} failed: ${ex.message}`);
        }
    });
    serverLog.log("Deplooy completed. ");
}