interface Config
{
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
export default <Config>{
    server: {
        host: "localhost",
        port:30996
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