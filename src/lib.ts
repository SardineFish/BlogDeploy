export async function foreachAsync<T>(list: T[], callback: (item: T, idx: number) => Promise<any>): Promise<T[]>
{
    for (let i = 0; i < list.length; i++)
    {
        await callback(list[i], i);
    }
    return list;
}
export async function mapAsync<TIn, TOut>(list: TIn[], func: (item: TIn, idx: number) => Promise<TOut>): Promise<TOut[]>
{
    let result: TOut[] = [];
    for (let i = 0; i < list.length; i++)
    {
        result[i] = await func(list[i], i);
    }
    return result;
}
export class PromiseSchedule extends Promise<void>
{
    private tasks: Promise<any>[];
    state: "pending" | "running" | "ready" = "pending";
    private completeCount: number = 0;
    constructor(...tasks: Promise<any>[])
    {
        super((resolve, reject) => this.start(resolve, reject));
        this.tasks = tasks;
    }
    private start(resolve: () => void, reject: (reason?: any) => void)
    {
        this.state = "running";
        this.tasks.forEach(task => task.catch(reason => reject(reason)).then(() =>
        {
            this.completeCount++;
            if (this.completeCount == this.tasks.length)
            {
                resolve();
            }
        }));
    }
    add(task: Promise<any>)
    {
        if (this.state !== "pending")
        {
            throw new Error("Cannot add new task now. ");
        }
        this.tasks.push(task);
    }
}