import { NextApiRequest, NextApiResponse } from 'next';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getTime } from 'date-fns';
import axios from 'axios';

import AdminAuthMiddleware from '@/middlewares/AdminAuthMiddleware';

const prisma = new PrismaClient();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const DISCORD_WEBHOOK_URL = process.env.DISCORD_ADMIN_ACTIONS_WEBHOOK_URL;

async function logAction(
  title: string,
  subtitle: string,
  description: string,
  req: NextApiRequest,
  color: string
) {
  const { token } = req.cookies;

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token as string, JWT_SECRET_KEY as string) as JwtPayload;
  } catch (error) {
    console.error(error);
    return;
  }

  const adminId = decoded.id;

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { username: true },
  });

  const adminUsername = admin?.username;

  const message = {
    embeds: [
      {
        title: `${adminUsername} ${title}`,
        color,
        fields: [
          {
            name: `${subtitle}`,
            value: `${description}`,
          },
          {
            name: 'Horário',
            value: `<t:${Math.floor(getTime(new Date()) / 1000)}:R>`,
          },
        ],
      },
    ],
  };

  try {
    await axios.post(DISCORD_WEBHOOK_URL as string, message);
  } catch (error) {
    console.error(error);
  }
}

async function GenerateAccessKeysAPI(req: NextApiRequest, res: NextApiResponse) {
  let { amount = 1, duration } = req.body;
  const { token } = req.cookies;

  if (amount < 1) {
    return res.status(400).json({
      message: 'Quantidade mínima de chaves é 1.',
    });
  }

  if (amount > 100) {
    return res.status(400).json({
      message: 'Quantidade máxima de chaves excedida.',
    });
  }

  if (!['1d', '7d', '30d'].includes(duration)) {
    return res.status(400).json({
      message: 'Duração inválida.',
    });
  }

  let adminId: string;

  try {
    const decoded = jwt.verify(token as string, JWT_SECRET_KEY as string) as { id: string };
    adminId = decoded.id;
  } catch (error) {
    console.error(error);
    return;
  }

  try {
    const existingKeys = await prisma.accessKey.findMany({ select: { key: true } });
    const existingKeySet = new Set(existingKeys.map((key) => key.key));

    const newAccessKeysData = [];
    const generatedKeys = new Set();

    for (let i = 0; i < amount; i++) {
      let generatedKey;
      do {
        generatedKey = uuidv4();
      } while (existingKeySet.has(generatedKey) || generatedKeys.has(generatedKey));

      generatedKeys.add(generatedKey);

      newAccessKeysData.push({
        key: generatedKey,
        duration: duration,
        createdById: adminId,
      });
    }

    await prisma.accessKey.createMany({
      data: newAccessKeysData,
    });

    const accessKeys = Array.from(generatedKeys);

    await logAction(
      `gerou ${amount > 1 ? '' : 'uma'} chave${amount > 1 ? 's' : ''} de acesso`,
      'Quantidade',
      amount,
      req,
      '3066993'
    );
    return res.status(200).json({
      duration,
      accessKeys,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: `Erro ao gerar a${amount > 1 ? 's' : ''} chave${amount > 1 ? 's' : ''} de acesso.`,
    });
  }
}

async function BlacklistAPI(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.body;
  const { token } = req.cookies;

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token as string, JWT_SECRET_KEY as string) as JwtPayload;
  } catch (error) {
    console.error(error);
    return;
  }

  const adminId = decoded.id;

  const admin = await prisma.user.findUnique({ where: { id: adminId } });

  const adminUsername = admin?.username;

  if (username.toLowerCase() == adminUsername?.toLowerCase()) {
    return res.status(400).json({
      message: 'Você não pode se colocar na lista negra.',
    });
  }

  prisma.user
    .findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    })
    .then((user) => {
      if (!user) {
        return res.status(404).json({
          message: 'Usuário não encontrado.',
        });
      }

      if (user.blacklisted) {
        return res.status(400).json({
          message: 'Usuário já está na lista negra.',
        });
      }
      prisma.user
        .updateMany({
          where: {
            username: {
              equals: user.username,
              mode: 'insensitive',
            },
          },
          data: { blacklisted: true },
        })
        .then(async (result) => {
          if (result.count > 0) {
            await logAction(
              'adicionou um usuário à lista negra',
              'Usuário',
              user.username,
              req,
              '15548997'
            );
            return res.status(200).json({
              message: 'Usuário adicionado à lista negra.',
            });
          }
          return res.status(404).json({
            message: 'Usuário não encontrado.',
          });
        })
        .catch((error) => {
          console.error(error);
          return res.status(500).json({
            message: 'Erro ao tentar adicionar o usuário à lista negra.',
          });
        });
    })
    .catch((error) => {
      console.error(error);
      return res.status(500).json({
        message: 'Erro ao tentar adicionar o usuário à lista negra.',
      });
    });
}

async function UnblacklistAPI(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.body;

  prisma.user
    .findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    })
    .then((user) => {
      if (!user) {
        return res.status(404).json({
          message: 'Usuário não encontrado.',
        });
      }

      if (!user.blacklisted) {
        return res.status(400).json({
          message: 'Usuário não está na lista negra.',
        });
      }

      return prisma.user
        .updateMany({
          where: {
            username: {
              equals: user.username,
              mode: 'insensitive',
            },
          },
          data: { blacklisted: false },
        })
        .then(async (result) => {
          if (result.count > 0) {
            await logAction(
              'removeu um usuário da lista negra',
              'Usuário',
              user.username,
              req,
              '15548997'
            );
            return res.status(200).json({
              message: 'Usuário removido da lista negra.',
            });
          }
          return res.status(404).json({
            message: 'Usuário não encontrado.',
          });
        })
        .catch((error) => {
          console.error(error);
          return res.status(500).json({
            message: 'Erro ao tentar remover o usuário da lista negra.',
          });
        });
    })
    .catch((error) => {
      console.error(error);
      return res.status(500).json({
        message: 'Erro ao tentar remover o usuário da lista negra.',
      });
    });
}

async function LookupAPI(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado.',
      });
    }

    return res.status(200).json({
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        expirationDate: user.expirationDate,
        queries: user.queries,
        blacklisted: user.blacklisted,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erro ao consultar o usuário.',
    });
  }
}

async function RequestHandler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;
  const selectedAction = Array.isArray(action) ? action[0] : action;

  if (req.method === 'POST' && selectedAction === 'generate') {
    GenerateAccessKeysAPI(req, res);
  } else if (req.method === 'POST' && selectedAction === 'blacklist') {
    BlacklistAPI(req, res);
  } else if (req.method === 'POST' && selectedAction === 'unblacklist') {
    UnblacklistAPI(req, res);
  } else if (req.method === 'POST' && selectedAction === 'lookup') {
    LookupAPI(req, res);
  } else if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Método de requisição inválido.',
    });
  }
}

export default AdminAuthMiddleware(RequestHandler);
