import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import NodeCache from 'node-cache';
import requestIp from 'request-ip';
import { isPast } from 'date-fns';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const { JWT_SECRET_KEY } = process.env;

const cache = new NodeCache();

const RATE_LIMIT_DURATION = 6000;
const REQUEST_LIMIT = 1;

export default function AuthMiddleware(
  handler: (req: NextApiRequest, res: NextApiResponse) => any
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { token } = req.cookies;
    const ipAddress = requestIp.getClientIp(req);
    const cacheKey = `ip:${ipAddress}:${req.url}`;

    let requestCount: number = cache.get(cacheKey) || 0;

    if (token) {
      try {
        const decodedToken = jwt.verify(token, JWT_SECRET_KEY as string) as {
          id: string;
        };

        const user = await prisma.user.findUnique({
          where: { id: decodedToken.id },
          select: {
            id: true,
            username: true,
            role: true,
            expirationDate: true,
            queries: true,
            blacklisted: true,
          },
        });

        if (user && user.role !== 'admin') {
          if (requestCount >= REQUEST_LIMIT && res.statusCode >= 400) {
            return res.status(429).json({
              message: 'Limite de requisições excedido.',
            });
          }

          if (user.blacklisted) {
            return res.status(401).json({
              message: 'O usuário está na lista negra.',
            });
          }

          if (isPast(new Date(user.expirationDate))) {
            return res.status(401).json({
              message: 'O plano do usuário está expirado.',
            });
          }

          requestCount++;
          cache.set(cacheKey, requestCount, RATE_LIMIT_DURATION);
        }

        return handler(req, res);
      } catch (error) {
        console.error(error);
      }
    }

    requestCount++;
    cache.set(cacheKey, requestCount, RATE_LIMIT_DURATION);

    if (requestCount >= REQUEST_LIMIT) {
      return res.status(429).json({
        message: 'Limite de requisições excedido.',
      });
    }

    return res.status(401).json({ message: 'Não autorizado.' });
  };
}
