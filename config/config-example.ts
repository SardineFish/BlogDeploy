interface Config
{
    server: {
        host: string;
        port: number;
        log: string;
    };
    webhook: {
        url: string,
        secret: string,
        method: "GET" | "POST";
    }
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
export default <Config>{
    server: {
        host: "localhost",
        port: 30996,
        log: "./log.txt"
    },
    webhook: {
        secret: "",
        url: "/webhook",
        method: "POST",
    },
    git: {
        path: "/path/to/repo",
        repository: "",
        branch: "master",
    },
    ftp: {
        address: "",
        username: "",
        password: "",
        folder: "",
    }
}