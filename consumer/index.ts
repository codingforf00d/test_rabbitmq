import {connect, Message, Channel} from 'amqplib'
import { createClient, RedisClientType } from 'redis';
import type { WorkingTask, Result } from './types.d.ts';

const queueName = 'tasks';

const createConnections = async () => {
  const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:6379`
  });
  await redisClient.connect();
  
  const rabbitChannel = await connect(`amqp://${process.env.RABBIT_HOST}:5672`).then((conn) => conn.createChannel());
  await rabbitChannel.assertQueue(queueName);
  return [rabbitChannel, redisClient] as const;
}

async function consumeTask(channel: Channel, redis: RedisClientType<any>) {
  try {
    channel.consume(queueName, createConsumer(channel, redis as any));
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

const createConsumer = (channel: Channel, redis: RedisClientType) => {
  return async (msg: Message) => {
    if (msg) {
      const task: WorkingTask = JSON.parse(msg.content.toString('utf-8'));
      const result: Result = processTask(task);

      await redis.set(task['taskId'], JSON.stringify(result));
      channel.ack(msg);
    }
    }
}

function processTask(task: WorkingTask): Result {
  return ({
    taskId: task['taskId'],
    result: {result: 'done'},
    status: 'done'
  });
}

createConnections().then(([channel, redis]) => consumeTask(channel, redis as any))
