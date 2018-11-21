import { EventEmitter } from "events";
import fs from "fs";
const LogEvent = "log";
export class ServerLog
{
    static instance: ServerLog;
    logFile: string;
    logEventEmitter: EventEmitter = new EventEmitter();
    constructor(logFile: string)
    {
        this.logFile = logFile;
        ServerLog.instance = this;
    }

    private writeLog(msg:string)
    {
        fs.writeFileSync(this.logFile, msg + "\r\n", { flag: "a" });
        this.logEventEmitter.emit(LogEvent, msg);
    }
    log(message: any)
    {
        this.writeLog(`[${new Date().toLocaleString()}] [Log] ${message}`);
        console.log(`[${new Date().toLocaleString()}] ${message}`);
    }
    warn(message: any)
    {
        this.writeLog(`[${new Date().toLocaleString()}] [Warn] ${message}`);
        console.warn(`[${new Date().toLocaleString()}] ${message}`);
    }
    error(message: any)
    {
        this.writeLog(`[${new Date().toLocaleString()}] [Error] ${message}`);
        console.error(`[${new Date().toLocaleString()}] ${message}`);
    }
    onLog(listener: (msg: string) => void)
    {
        this.logEventEmitter.addListener(LogEvent, listener);
    }
    removeLogListener(listener: (msg: string) => void)
    {
        this.logEventEmitter.removeListener(LogEvent, listener);
    }
}