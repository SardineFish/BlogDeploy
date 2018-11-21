import ftp from "ftp";
import URL from "url";
import { promisify } from "util";
import Path from "path";
import { ServerLog } from "./log";

let console: ServerLog;

export class FTPClient
{
    address: string;
    username: string;
    password: string;
    client: ftp;
    constructor(address: string, username: string, password: string, log:ServerLog)
    {
        this.address = address;
        this.username = username;
        this.password = password;
        console = log;
    }

    async connect()
    {
        this.client = await new Promise<ftp>((resolve) =>
        {
            let client = new ftp();
            client.on("ready", () =>
            {
                resolve(client);
            });
            let urlInfo = URL.parse(this.address);
            client.connect({
                host: urlInfo.hostname,
                port: parseInt(urlInfo.port) || 21,
                user: this.username,
                password: this.password
            });
            console.log(`FTP connected to ${this.address}`);
        });
    }

    close()
    {
        this.client.end();
    }

    async list(path:string)
    {
        return new Promise<ftp.ListingElement[]>((resolve, reject) =>
        {
            this.client.list(path, (error, listing) =>
            {
                if (error)
                    reject(error);
                else
                    resolve(listing);
            });
        });
    }

    async put(localPath: string, remotePath: string)
    {
        return new Promise<void>((resolve, reject) =>
        {
            this.client.mkdir(Path.dirname(remotePath), true, () =>
            {
                this.client.put(localPath, remotePath, (error) =>
                {
                    if (error)
                        reject(error);
                    else
                        resolve();
                });
            });
            
        });
    }
}