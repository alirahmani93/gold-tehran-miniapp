import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { findToken } from '../db/repo.js';
import { rateLimitHit } from '../cache/redis.js';

declare module 'fastify' {
  interface FastifyRequest {
    apiToken?: { token: string; name: string; rate_limit_per_min: number };
  }
}

export async function registerAuth(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.url === '/v1/health' || req.url.startsWith('/v1/health?')) return;

    const headerVal = req.headers['x-api-token'];
    const token = Array.isArray(headerVal) ? headerVal[0] : headerVal;
    if (!token) {
      return reply.code(401).send({ error: 'missing x-api-token' });
    }
    const row = findToken(token);
    if (!row) {
      return reply.code(401).send({ error: 'invalid or disabled token' });
    }

    const rl = await rateLimitHit(row.token, row.rate_limit_per_min);
    reply.header('x-ratelimit-limit', String(row.rate_limit_per_min));
    reply.header('x-ratelimit-remaining', String(rl.remaining));
    reply.header('x-ratelimit-reset', String(rl.resetSec));
    if (!rl.allowed) {
      return reply.code(429).send({ error: 'rate limit exceeded', retry_after_sec: rl.resetSec });
    }
    req.apiToken = { token: row.token, name: row.name, rate_limit_per_min: row.rate_limit_per_min };
  });
}
