
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

    const referenciadores = await prisma.referenciador.findMany({
      include: {
        referenciador: {
          select: {
            nombre: true,
            codigo: true
          }
        },
        referidos: {
          select: {
            id: true,
            nombre: true,
            estatusRegistro: true
          }
        },
        solicitudesCredito: {
          select: {
            id: true,
            monto: true,
            estatus: true,
            fechaSolicitud: true
          }
        },
        incentivos: {
          select: {
            monto: true,
            estado: true
          }
        },
        comisiones: {
          select: {
            monto: true,
            estado: true
          }
        }
      },
      orderBy: {
        fechaRegistro: 'desc'
      }
    });

    return NextResponse.json(referenciadores);

  } catch (error) {
    console.error('Error obteniendo referenciadores:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
