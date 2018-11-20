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
    
}
