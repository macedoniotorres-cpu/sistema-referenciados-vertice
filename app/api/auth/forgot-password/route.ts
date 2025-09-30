

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'El correo electrónico es requerido' },
        { status: 400 }
      );
    }

    // Buscar si existe un referenciador con este correo
    const referenciador = await prisma.referenciador.findUnique({
      where: { correo: email }
    });

    if (!referenciador) {
      // Por seguridad, no revelamos si el email existe o no
      return NextResponse.json({
        message: 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.'
      });
    }

    // Generar token único y seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token válido por 1 hora

    // Invalidar tokens anteriores para este email
    await prisma.passwordResetToken.updateMany({
      where: { 
        email: email,
        usado: false
      },
      data: { usado: true }
    });

    // Crear nuevo token
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        email: email,
        expires: expires
      }
    });

    // En un entorno real, aquí enviarías el email
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    console.log('🔐 Link de recuperación de contraseña:', resetLink);
    console.log('📧 Para el email:', email);

    return NextResponse.json({
      message: 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
      // En desarrollo, incluimos el link para facilitar las pruebas
      ...(process.env.NODE_ENV === 'development' && { resetLink })
    });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

