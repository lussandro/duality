import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { getTime, isPast } from 'date-fns';
import NodeCache from 'node-cache';
import requestIp from 'request-ip'
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import axios from 'axios';

const prisma = new PrismaClient();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const cache = new NodeCache();

const RATE_LIMIT_DURATION = 60;
const REQUEST_LIMIT = 5;

const DISCORD_WEBHOOK_URL = process.env.DISCORD_LOGIN_WEBHOOK_URL;
async function logLogin(username: string, ipAddress: string) {
  try {
    if (DISCORD_WEBHOOK_URL) {
      await axios.post(DISCORD_WEBHOOK_URL, {
        embeds: [
          {
            title: 'Login realizado com sucesso',
            color: 3066993,
            fields: [
              {
                name: 'Usuário',
                value: username,
              },
              {
                name: 'IP',
                value: ipAddress,
              },
              {
                name: 'Horário',
                value: `<t:${Math.floor(getTime(new Date()) / 1000)}:R>`,
              },
            ],
          },
        ],
      });
    }
  } catch (error) {
    console.error(error);
  }
}

export default async function LoginAPI(req: NextApiRequest, res: NextApiResponse) {
  const { username, password } = req.body;
  const ipAddress = requestIp.getClientIp(req);
  const cacheKey = `ip:${ipAddress}:${req.url}`;

  const requestCount = (cache.get(cacheKey) as number | undefined) || 0;
  cache.set(cacheKey, requestCount + 1, RATE_LIMIT_DURATION);

  if (requestCount >= REQUEST_LIMIT) {
    cache.ttl(cacheKey);
    return res.status(429).json({
      message: 'Limite de requisições excedido.',
    });
  }

  let user;

  try {
    user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !(await argon2.verify(user.password, password))) {
      return res.status(401).json({ message: 'Usuário e/ou senha inválidos.' });
    }

    if (user.blacklisted) {
      return res.status(401).json({
        message: 'Você está na lista negra.',
      });
    }

    let { token } = user;

    if (
      !token ||
      !jwt.verify(token, JWT_SECRET_KEY as string) ||
      isPast(new Date(user.expirationDate))
    ) {
      if (isPast(new Date(user.expirationDate))) {
        return res.status(401).json({
          message: 'Seu plano está expirado.',
        });
      }

      const newToken = jwt.sign({ id: user.id }, JWT_SECRET_KEY as string, { expiresIn: '1d' });

      await prisma.user.update({
        where: { username },
        data: { token: newToken },
      });
      token = newToken;
    }

    await logLogin(username, ipAddress as string);

    return res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      const newToken = jwt.sign({ id: user?.id }, JWT_SECRET_KEY as string, { expiresIn: '1d' });

      await prisma.user.update({
        where: { username },
        data: { token: newToken },
      });

      return res.status(200).json({
        token: newToken,
      });
    }
    return res.status(500).json({ message: 'Erro ao processar o login.' });
  }
}
