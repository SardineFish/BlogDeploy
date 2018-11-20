interface Config
{
    server: {
        host: string,
        port: number,
    };
    ftp: {
        address: string,
        folder: string,
    };
    git: {
        repository: string;
        branch: string;
        sshKey: string;
    }
}
export default <Config>{
    server: {
        host: "localhost",
        port: 30996
    },
    ftp: {
        address: "",
        folder: "/",
    },
    git: {
        repository: "",
        branch: "master",
        sshKey: "",
    }
}
