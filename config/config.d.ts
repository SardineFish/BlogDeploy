interface Config {
    server: {
        host: string;
        port: number;
    };
    ftp: {
        address: string;
        folder: string;
    };
    git: {
        repository: string;
        branch: string;
        sshKey: string;
    };
}
declare const _default: Config;
export default _default;
