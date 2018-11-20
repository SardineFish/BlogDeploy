import http from "http";
import Koa from "koa";
import Router from "koa-router";
import config from "../config/config";

const app = new Koa();
const router = new Router();
app
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(config.server.port, config.server.host);

router.post("/update", (ctx, next) =>
{
    console.log(ctx.request);   
});