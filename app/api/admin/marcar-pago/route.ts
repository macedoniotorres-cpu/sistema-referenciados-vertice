

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

    const { id, tipo, pagado } = await request.json();

    if (!id || !tipo || typeof pagado !== 'boolean') {
      return NextResponse.json(
        { message: 'Datos incompletos' },
        { status: 400 }
      );
    }

    if (!['incentivo', 'comision'].includes(tipo)) {
      return NextResponse.json(
        { message: 'Tipo de pago inválido' },
        { status: 400 }
      );
    }

    const fechaPago = pagado ? new Date() : null;
    const nuevoEstado = pagado ? 'PAGADO' : 'PENDIENTE';

    if (tipo === 'incentivo') {
      await prisma.incentivo.update({
        where: { id },
        data: {
          estado: nuevoEstado,
          fechaPago
        }
      });
    } else {
      await prisma.comision.update({
        where: { id },
        data: {
          estado: nuevoEstado,
          fechaPago
        }
      });
    }

    const mensaje = pagado 
      ? `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} marcado como pagado`
      : `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} marcado como pendiente`;

    return NextResponse.json({
      message: mensaje,
      success: true
    });

  } catch (error) {
    console.error('Error marcando pago:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

