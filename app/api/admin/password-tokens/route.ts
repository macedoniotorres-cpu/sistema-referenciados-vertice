

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener tokens de recuperación de contraseña más recientes
    const tokens = await prisma.passwordResetToken.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const tokensWithLinks = tokens.map(token => ({
      ...token,
      resetLink: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token.token}`,
      expirado: token.expires < new Date(),
      tiempoRestante: token.expires > new Date() ? Math.ceil((token.expires.getTime() - new Date().getTime()) / (1000 * 60)) : 0
    }));

    return NextResponse.json(tokensWithLinks);

  } catch (error) {
    console.error('Error obteniendo tokens de password:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

