import express from 'express';
import {connect} from 'amqplib';
import { randomUUID } from 'crypto';
import { createClient } from 'redis';
import type { WorkingTask } from './types.d.ts';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:6379`
  });


const rabbitChannel = await connect(`amqp://${process.env.RABBIT_HOST}:5672`).then((conn) => conn.createChannel());
const tasksQueue = 'tasks';


app.post('/create_task', async (req: any, res: any) => {
  const message = req.body;
  if (message == null) {
    res.send('Message is empty')
  }

  try {
    await rabbitChannel.assertQueue(tasksQueue);
    const taskId = randomUUID();
    const task: WorkingTask = {
        status: 'processing',
        task: message,
        taskId,
    };
    const taskJson = JSON.stringify(task);
    rabbitChannel.sendToQueue(tasksQueue, Buffer.from(taskJson));

    await redisClient.set(taskId, taskJson);
    res.send({
        taskId
    });
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).send('Error when adding task to queue');
  }
});

app.get('/task_result', async (req: any, res: any) => {
    const taskId = req.query.taskId as string;
    if (!taskId) {
        res.send('Parameter taskId unfilled');
    }

    const result = await redisClient.get(taskId);
    res.send({
        result
    });
});

redisClient.connect().then(() => app.listen(3000, () => {
  console.log('listening 3000');
}));
