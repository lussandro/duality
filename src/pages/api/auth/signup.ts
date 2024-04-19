import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getTime } from 'date-fns';
import NodeCache from 'node-cache';
import requestIp from 'request-ip';
import argon2 from 'argon2';
import axios from 'axios';

const prisma = new PrismaClient();

const cache = new NodeCache();

const RATE_LIMIT_DURATION = 60;
const REQUEST_LIMIT = 5;

const DISCORD_WEBHOOK_URL = process.env.DISCORD_SIGNUP_WEBHOOK_URL;

function validateUsername(username: any) {
  const regex = /^[a-zA-Z0-9!@#$%^&*()\-=_+[\]{};':",.<>/?]{3,20}$/;
  return regex.test(username);
}

function validatePassword(password: any) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\];':",.<>\/\\\?])(?!.*\s).{8,32}$/;
  return regex.test(password);
}

async function logSignup(username: string, ipAddress: string) {
  try {
    if (DISCORD_WEBHOOK_URL) {
      await axios.post(DISCORD_WEBHOOK_URL, {
        embeds: [
          {
            title: 'Registro realizado com sucesso',
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

export default async function SignupAPI(req: NextApiRequest, res: NextApiResponse) {
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

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
  }

  if (!validateUsername(username)) {
    return res.status(400).json({
      message:
        'O usuário deve ter entre 3 e 20 caracteres e pode conter apenas letras maiúsculas, minúsculas, números e caracteres especiais.',
    });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      message:
        'A senha deve ter entre 8 e 32 caracteres e deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial.',
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe.' });
    }

    const hashedPassword = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'user',
        expirationDate: '1970-01-01T00:00:00.000Z',
      },
    });

    await logSignup(user.username, ipAddress as string);

    return res.status(200).json({ message: 'Registro realizado com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao processar o registro.' });
  }
}
