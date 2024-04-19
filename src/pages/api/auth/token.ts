import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { isPast } from 'date-fns';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';

import AuthMiddleware from '@/middlewares/AuthMiddleware';

const prisma = new PrismaClient();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

async function TokenDataAPI(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.cookies;
  try {
    const decoded = jwt.verify(token as string, JWT_SECRET_KEY as string) as JwtPayload;

    if (decoded && 'id' in decoded) {
      const { id } = decoded;
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          role: true,
          expirationDate: true,
          queries: true,
          blacklisted: true,
        },
      });

      if (user) {
        if (user.blacklisted) {
          return res.status(401).json({
            message: 'O usuário está na lista negra.',
          });
        }

        if (user.expirationDate && isPast(new Date(user.expirationDate))) {
          return res.status(401).json({
            message: 'O plano do usuário está expirado.',
          });
        }

        const data = {
          id: user.id,
          username: user.username,
          role: user.role,
          expirationDate: user.expirationDate,
          queries: user.queries,
          blacklisted: user.blacklisted,
        };

        return res.status(200).json({
          token,
          data,
        });
      }
    }
    return res.status(401).json({
      message: 'Token inválido.',
    });
  } catch (error) {
    console.error(error);
    if (error instanceof TokenExpiredError) {
      return res.status(401).json({
        message: 'Token expirado.',
      });
    }

    return res.status(401).json({
      message: 'Token inválido.',
    });
  }
}

export default AuthMiddleware(TokenDataAPI);
