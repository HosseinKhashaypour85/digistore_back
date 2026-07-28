const redis = require('redis');

const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

redisClient.on('connect', () => console.log('Redis connected'));

async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
    return redisClient;
}

async function getCache(key) {
    const client = await connectRedis();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
}

async function setCache(key, value, ttlSeconds = 60) {
    const client = await connectRedis();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
}

async function deleteCache(key) {
    const client = await connectRedis();
    await client.del(key);
}

module.exports = { connectRedis, getCache, setCache, deleteCache, redisClient };