import http from "http";
import Koa from "koa";
import Router from "koa-router";
import config from "../config/config";
import { Push,  } from "github-webhook-event-types";
import koaBody = require("koa-body");
import Git from "nodegit";
import { GitRepo } from "./git";

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
git.open();
