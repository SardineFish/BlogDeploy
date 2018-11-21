import Git from "nodegit";
import Path from "path";
import linq from "linq";
import { mapAsync } from "./lib";

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
            let oldCommit = await this.repo.getHeadCommit();
            console.log(`Merging origin/${this.branch} to ${this.branch}`);
            await this.repo.mergeBranches(this.branch, `origin/${this.branch}`);
            console.log(`Merged.`);
            let newCommit = await this.repo.getHeadCommit();
            return await this.getChangedFiles(await this.diff(newCommit, oldCommit));
        }
        catch (ex)
        {
            console.error(`Pull failed: ${ex.message}`);
        }
        return [];
    }

    async isParentOf(parent: Git.Commit, child: Git.Commit): Promise<boolean>
    {
        if (parent.id().cmp(child.id()) == 0)
            return true;
        return this.isParentOf(parent, await child.parent(0));
    }
    
    async diff(newCommit: Git.Commit, oldCommit: Git.Commit)
    {
        var oid = oldCommit.id().tostrS();
        if (!await this.isParentOf(oldCommit,newCommit))
            throw new Error(`Diff error. Commit ${oldCommit.id()} is not parent of Commit ${newCommit.id()}`);
        
        let diffs: Git.Diff[] = [];
        let commit = await newCommit.parent(0);//await this.repo.getCommit(newCommit.parentId(0));
        var x = 0;
        for (let commit = newCommit; commit.id().cmp(oldCommit.id()) != 0; commit = await this.repo.getCommit(commit.parentId(0)))
        {
            diffs = diffs.concat(await commit.getDiff());

        }
        return diffs;
    }

    async getChangedFiles(diffs: Git.Diff[])
    {
        let diffFiles =  await mapAsync(diffs, async (diff) =>
            await diff.patches()
                .then(patches =>
                    patches.map(
                        patch => <FileChanges>{
                            oldFile: patch.oldFile(),
                            newFile: patch.newFile()
                        })));
        let files: FileChanges[] = [];
        diffFiles.forEach(f => files = files.concat(...f));
        let paths = linq.from(files).groupBy(f => f.newFile.path()).select(group => group.key()).toArray();
        return paths;
    }
}

interface FileChanges
{
    oldFile: Git.DiffFile;
    newFile: Git.DiffFile;
}