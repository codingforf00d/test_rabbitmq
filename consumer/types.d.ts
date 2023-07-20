export type Task = {
    taskId: string;
}

export type WorkingTask = Task & {
    task: any;
    status: 'processing';

}

export type Result = Task & {
    result: any;
    status: 'done';
}