interface Config {
    server: {
        host: string;
        port: number;
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
