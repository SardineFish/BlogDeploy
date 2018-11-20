import Git from "nodegit";
import Path from "path";
export class GitRepo
{
    path: string;
    url: string;
    branch: string;
    repo: Git.Repository;
    constructor(path: string, url:string, branch: string)
    {
        this.path = Path.resolve(path);
        this.url = url;
        this.branch = branch;
    }

    async open()
    {
        try
        {
            this.repo = await Git.Repository.open(this.path);
            console.log(`Repository opened at ${this.path}`);
        }
        catch (ex)
        {
            console.error(ex.message);
            console.log(`Clone ${this.branch} from ${this.url} into ${this.path}`);
            this.repo = await Git.Clone.clone(this.url, this.path, {
                checkoutBranch: this.branch
            });
            console.log(`Repository opened at ${this.path}`);
        }
        return this;
    }

    async pull()
    {
        try
        {
            console.log(`Fetching all from ${this.url}`);
            await this.repo.fetchAll();
            console.log(`Merging origin/${this.branch} to ${this.branch}`);
            await this.repo.mergeBranches(this.branch, `origin/${this.branch}`);
            console.log(`Merged.`);
        }
        catch (ex)
        {
            console.error(`Pull failed: ${ex.message}`);
        }
        return this;
    }
}