
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.referenciadorId) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { monto, motivo } = body;

    if (!monto || !motivo) {
      return NextResponse.json(
        { message: 'Monto y motivo son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que el referenciador esté activo
    const referenciador = await prisma.referenciador.findUnique({
      where: { id: session.user.referenciadorId }
    });

    if (!referenciador || referenciador.estatusRegistro !== 'ACTIVO') {
      return NextResponse.json(
        { message: 'Tu registro debe estar activo para solicitar créditos' },
        { status: 400 }
      );
    }

    // Crear solicitud de crédito
    const solicitud = await prisma.solicitudCredito.create({
      data: {
        referenciadorId: session.user.referenciadorId,
        monto: parseFloat(monto),
        motivo
      }
    });

    // Actualizar estatus de crédito del referenciador
    await prisma.referenciador.update({
      where: { id: session.user.referenciadorId },
      data: { estatusCredito: 'PENDIENTE' }
    });

    return NextResponse.json(
      { 
        message: 'Solicitud de crédito enviada exitosamente',
        solicitudId: solicitud.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creando solicitud de crédito:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
