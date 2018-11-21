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

//const app = new Koa();
const router = new Router();
router
    .post("/update", (ctx, next) =>
    {
        ctx.response.status = 200;
        
    });

/*app
    .use(koaBody())
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(config.server.port, config.server.host);*/

const git = new GitRepo(config.git.path, config.git.repository, config.git.branch);
const ftp = new FTPClient(config.ftp.address, config.ftp.username, config.ftp.password);
setup();
async function testGit()
{
    await ftp.connect();
    console.log(await ftp.list("/"));
    await git.open();
    await git.pull();
    //git.diff(await git.repo.getHeadCommit(), await (await git.repo.getHeadCommit()).parent(0));
}
async function setup()
{
    await ftp.connect();
    await git.open();
    //await new PromiseSchedule(ftp.connect(), git.open());
    let files = await git.pull();
    await foreachAsync(files, async (file) =>
    {
        try
        {
            if (await promisify(fs.exists)(Path.resolve(git.path, file)))
            {
                console.log(`Uploading ${file}`);
                await ftp.put(Path.resolve(git.path, file), Path.posix.join(config.ftp.folder, file));
            }
            else
                console.warn(`Ingore ${file}`);
        }
        catch (ex)
        {
            console.error(`Upload ${file} failed: ${ex.message}`);
        }
    });
    
}