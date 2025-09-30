

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { message: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: 'Las contraseñas no coinciden' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Buscar el token de reset
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken) {
      return NextResponse.json(
        { message: 'Token de recuperación inválido' },
        { status: 400 }
      );
    }

    // Verificar si el token ya fue usado
    if (resetToken.usado) {
      return NextResponse.json(
        { message: 'Este enlace de recuperación ya fue utilizado' },
        { status: 400 }
      );
    }

    // Verificar si el token ha expirado
    if (resetToken.expires < new Date()) {
      return NextResponse.json(
        { message: 'Este enlace de recuperación ha expirado' },
        { status: 400 }
      );
    }

    // Buscar el referenciador con este email
    const referenciador = await prisma.referenciador.findUnique({
      where: { correo: resetToken.email }
    });

    if (!referenciador) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Actualizar la contraseña del referenciador
    await prisma.referenciador.update({
      where: { id: referenciador.id },
      data: { password: hashedPassword }
    });

    // Marcar el token como usado
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usado: true }
    });

    return NextResponse.json({
      message: 'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

