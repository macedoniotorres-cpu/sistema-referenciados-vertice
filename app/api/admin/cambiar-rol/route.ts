

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { referenciadorId, nuevoRol } = await request.json();

    if (!referenciadorId || !nuevoRol) {
      return NextResponse.json(
        { message: 'Datos incompletos' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'REFERENCIADOR'].includes(nuevoRol)) {
      return NextResponse.json(
        { message: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Buscar el referenciador
    const referenciador = await prisma.referenciador.findUnique({
      where: { id: referenciadorId },
      include: {
        user: true
      }
    });

    if (!referenciador) {
      return NextResponse.json(
        { message: 'Referenciador no encontrado' },
        { status: 404 }
      );
    }

    // No permitir que el admin se quite a sí mismo el rol de admin
    if (referenciador.userId === session.user.id && nuevoRol === 'REFERENCIADOR') {
      return NextResponse.json(
        { message: 'No puedes quitarte el rol de administrador a ti mismo' },
        { status: 400 }
      );
    }

    // Actualizar el rol en la base de datos
    await prisma.referenciador.update({
      where: { id: referenciadorId },
      data: {
        tipoUsuario: nuevoRol
      }
    });

    const mensaje = nuevoRol === 'ADMIN' 
      ? `${referenciador.nombre} ha sido promovido a Administrador`
      : `${referenciador.nombre} ha sido cambiado a Referenciador`;

    return NextResponse.json({
      message: mensaje,
      success: true
    });

  } catch (error) {
    console.error('Error cambiando rol:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

