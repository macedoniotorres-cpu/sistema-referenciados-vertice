
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.referenciadorId) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const referidos = await prisma.referenciador.findMany({
      where: {
        referenciadorId: session.user.referenciadorId
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        correo: true,
        telefono: true,
        fechaRegistro: true,
        estatusRegistro: true,
        estatusCredito: true,
        solicitudesCredito: {
          select: {
            id: true,
            monto: true,
            estatus: true,
            fechaSolicitud: true
          }
        }
      },
      orderBy: {
        fechaRegistro: 'desc'
      }
    });

    return NextResponse.json(referidos);

  } catch (error) {
    console.error('Error obteniendo referidos:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
