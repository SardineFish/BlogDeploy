import http from "http";
import Koa from "koa";
import Router from "koa-router";
import config from "../config/config";
import { Push,  } from "github-webhook-event-types";
import koaBody = require("koa-body");
import Git from "nodegit";
import { GitRepo } from "./git";
import { FTPClient } from "./ftp";
import { PromiseSchedule, foreachAsync, TaskQueue } from "./lib";
import fs from "fs";
import { promisify } from "util";
import Path from "path";
import { ServerLog } from "./log";
import crypto from "crypto";
import { ProjectDeploy } from "./deploy";

const app = new Koa();
const router = new Router();
const serverLog = new ServerLog(config.server.log);
const deploy = new ProjectDeploy(serverLog);

router
    .post("/update", (ctx, next) =>
    {
        serverLog.log(`Request from ${ctx.request.ip}`);
        let signGithub = ctx.request.headers["x-hub-signature"];
        if (!signGithub)
        {
            ctx.response.status = 403;    
            serverLog.error("Request without signature. ");
            return;
        }
        let hmac = crypto.createHmac("sha1", config.webhook.secret);
        var body = ctx.req.read(ctx.request.length);
        hmac.update(body);
        let sign = `sha1=${hmac.digest().toString("hex")}`;
        if (sign !== signGithub)
        {
            ctx.response.status = 403;
            serverLog.error(`Signature missmatch. Give:${signGithub} Calcu:${sign}`);
            return;
        }
        deploy.requestDeploy();
        ctx.response.status = 200;
        serverLog.log(`Task added to queue. `);
    });

setup();
async function setup()
{
    try
    {
        await deploy.setup();
        app
            .use(koaBody({ json: false }))
            .use(router.routes())
            .use(router.allowedMethods())
            .listen(config.server.port, config.server.host);
        serverLog.log(`Server listening on http://${config.server.host}:${config.server.port}`);
    }
    catch (ex)
    {
        serverLog.error(`Server setup failed: ${ex.message}`);
    }
}