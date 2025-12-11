/**
 * redis.ts - Upstash Redis client singleton
 * 
 * Used by: API routes (room, socket), server-game.ts
 * Requires: UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN
 *           or REDIS_URL & REDIS_TOKEN env vars
 */

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export const getRedis = () => {
  if (redis) return redis;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
    return redis;
  }

  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
    return redis;
  }

  throw new Error("Missing Redis configuration. Set UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN or REDIS_URL/REDIS_TOKEN.");
};

