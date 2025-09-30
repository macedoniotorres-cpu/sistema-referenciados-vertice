
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

    const body = await request.json();
    const { referenciadorId, aprobar } = body;

    if (!referenciadorId || aprobar === undefined) {
      return NextResponse.json(
        { message: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const referenciador = await prisma.referenciador.findUnique({
      where: { id: referenciadorId },
      include: {
        referenciador: true
      }
    });

    if (!referenciador) {
      return NextResponse.json(
        { message: 'Referenciador no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar estatus del referenciador
    const nuevoEstatus = aprobar ? 'ACTIVO' : 'RECHAZADO';
    
    await prisma.referenciador.update({
      where: { id: referenciadorId },
      data: {
        estatusRegistro: nuevoEstatus
      }
    });

    // Si se aprueba y tiene referenciador, generar incentivo
    if (aprobar && referenciador.referenciadorId) {
      await prisma.incentivo.create({
        data: {
          referenciadorId: referenciador.referenciadorId,
          referidoId: referenciadorId,
          monto: 10.00,
          estado: 'PENDIENTE'
        }
      });
    }

    return NextResponse.json({
      message: `Referenciador ${aprobar ? 'aprobado' : 'rechazado'} exitosamente`
    });

  } catch (error) {
    console.error('Error actualizando referenciador:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
