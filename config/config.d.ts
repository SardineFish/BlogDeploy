interface Config {
    server: {
        host: string;
        port: number;
        log: string;
        queueSize: number;
    };
    webhook: {
        url: string;
        secret: string;
        method: "GET" | "POST";
    };
    ftp: {
        address: string;
        username: string;
        password: string;
        folder: string;
    };
    git: {
        path: string;
        repository: string;
        branch: string;
    };
}
declare const _default: Config;
export default _default;
