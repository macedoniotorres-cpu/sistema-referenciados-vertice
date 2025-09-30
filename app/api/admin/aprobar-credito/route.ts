
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
    const { solicitudId, aprobar, comentarios } = body;

    if (!solicitudId || aprobar === undefined) {
      return NextResponse.json(
        { message: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const solicitud = await prisma.solicitudCredito.findUnique({
      where: { id: solicitudId },
      include: {
        referenciador: {
          include: {
            referenciador: true
          }
        }
      }
    });

    if (!solicitud) {
      return NextResponse.json(
        { message: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    const nuevoEstatus = aprobar ? 'APROBADO' : 'RECHAZADO';
    
    // Actualizar solicitud
    await prisma.solicitudCredito.update({
      where: { id: solicitudId },
      data: {
        estatus: nuevoEstatus,
        fechaAprobacion: aprobar ? new Date() : undefined,
        fechaRechazo: !aprobar ? new Date() : undefined,
        comentarios: comentarios || undefined
      }
    });

    // Actualizar estatus de crédito del referenciador
    await prisma.referenciador.update({
      where: { id: solicitud.referenciadorId },
      data: {
        estatusCredito: nuevoEstatus
      }
    });

    // Si se aprueba y el referenciador tiene referenciador, generar comisión
    if (aprobar && solicitud.referenciador.referenciadorId) {
      await prisma.comision.create({
        data: {
          referenciadorId: solicitud.referenciador.referenciadorId,
          solicitudId: solicitudId,
          monto: 500.00,
          estado: 'PENDIENTE'
        }
      });
    }

    return NextResponse.json({
      message: `Solicitud ${aprobar ? 'aprobada' : 'rechazada'} exitosamente`
    });

  } catch (error) {
    console.error('Error actualizando solicitud:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
