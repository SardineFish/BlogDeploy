import { EventEmitter } from "events";

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
export class PromiseSchedule extends Promise<any>
{
    private tasks: Promise<any>[];
    state: "pending" | "running" | "ready" = "pending";
    private completeCount: number = 0;
    private resolve: () => void;
    private reject: (reason?: any) => void;
    constructor(...tasks: Promise<any>[])
    {
        super((resolve, reject) =>
        {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.tasks = tasks;
        this.state = "running";
        this.tasks.forEach(task => task.catch(reason => this.reject(reason)).then(() =>
        {
            this.completeCount++;
            if (this.completeCount == this.tasks.length)
            {
                this.resolve();
            }
        }));
    }
    private start()
    {
        
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
export class TaskQueue extends EventEmitter
{
    state: "running" | "ready" = "ready";
    private queue: Queue<Task>;
    get length() { return this.queue.length; }
    constructor(size: number)
    {
        super();
        this.queue = new Queue(size);
    }
    enqueue<T>(executor: () => Promise<T>): Promise<T>
    {
        return new Promise<T>((resolve, reject) =>
        {
            let task = new Task(executor);
            task.once(EventComplete, result => resolve(result));
            task.once(EventError, error => reject(error));
            this.queue.enqueue(task);
            if (this.queue.length == 1)
                this.runNext();
        });
    }
    private async runNext()
    {
        this.state = "running";
        while (this.queue.length > 0)
        {
            let task = this.queue.head;
            task.once(EventError, (error) => this.emit(EventError, error));
            if (task)
                await task.start();
            this.queue.dequeue();
        }
        this.state = "ready";
    }
}
const EventComplete = "complete";
const EventError = "error";
export class Task extends EventEmitter
{
    executor: () => Promise<any>;
    state: "pending" | "running" | "ready" = "pending";
    constructor(executor: () => Promise<any>)
    {
        super();
        this.executor = executor;
    }
    async start()
    {
        this.state = "running";
        try
        {
            let result = await this.executor();
            this.emit(EventComplete, result);
            return result;
        }
        catch (ex)
        {
            this.emit(EventError, ex);
        }
        this.state = "ready";
    }
}
export class Queue<T>
{
    list: T[] = [];
    size: number;
    length: number = 0;
    private tailIdx: number = 0;
    private headIdx: number = 0;
    get head() { return this.list[this.headIdx] }
    get tail() { return this.list[(this.tailIdx - 1 + this.length) % this.size] }
    constructor(size: number)
    {
        this.list.length = size;
        this.size = size;
    }
    enqueue(element: T)
    {
        if (this.length >= this.size)
        {
            throw new Error("The queue is full. ");    
        }
        this.list[this.tailIdx] = element;
        this.length++;
        this.tailIdx = (this.tailIdx + 1) % this.size;
    }
    dequeue(): T
    {
        if (this.length <= 0)
        {
            throw new Error("The queue is empty. ");
        }
        let element = this.list[this.headIdx];
        this.list[this.headIdx] = undefined;
        this.headIdx = (this.headIdx + 1) % this.size;
        this.length--;
        return element;
    }

}