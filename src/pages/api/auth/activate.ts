import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getTime, isPast, addDays } from 'date-fns';
import NodeCache from 'node-cache';
import requestIp, { getClientIp } from 'request-ip';
import axios from 'axios';

const prisma = new PrismaClient();

const cache = new NodeCache();

const RATE_LIMIT_DURATION = 60;
const REQUEST_LIMIT = 5;

const DISCORD_WEBHOOK_URL = process.env.DISCORD_ACTIVATION_WEBHOOK_URL;

async function logActivation(username: string, ipAddress: string) {
  try {
    if (DISCORD_WEBHOOK_URL) {
      await axios.post(DISCORD_WEBHOOK_URL, {
        embeds: [
          {
            title: 'Ativação realizada com sucesso',
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

export default async function ActivationAPI(req: NextApiRequest, res: NextApiResponse) {
  const { username, accessKey } = req.body;
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

  try {
    if (!username) {
      return res.status(400).json({
        message: 'Usuário não fornecido.',
      });
    }

    if (!accessKey) {
      return res.status(400).json({
        message: 'Chave não fornecida.',
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Usuário não encontrado.',
      });
    }

    const existingKey = await prisma.accessKey.findFirst({
      where: {
        key: accessKey,
      },
    });

    if (!existingKey) {
      return res.status(400).json({
        message: 'Chave inválida.',
      });
    }

    if (existingKey.usedById) {
      return res.status(400).json({
        message: 'Essa chave já foi usada.',
      });
    }

    const duration = existingKey.duration;
    let expirationDate = user.expirationDate;

    if (isPast(expirationDate)) {
      expirationDate = new Date();
    }

    expirationDate = addDays(expirationDate, parseInt(duration));

    await prisma.user.update({
      where: {
        username: username,
      },
      data: {
        expirationDate: expirationDate,
      },
    });

    await prisma.accessKey.update({
      where: {
        key: existingKey.key,
      },
      data: {
        usedAt: new Date(),
        usedById: user.id,
      },
    });

    await logActivation(username, ipAddress as string);

    return res.status(200).json({
      message: 'Chave ativada com sucesso.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erro ao ativar a chave.',
    });
  }
}
