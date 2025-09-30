

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

    // Obtener incentivos con información del referenciador que recibe y el referido que lo generó
    const incentivos = await prisma.incentivo.findMany({
      include: {
        referenciador: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            correo: true
          }
        }
      },
      orderBy: {
        fechaGeneracion: 'desc'
      }
    });

    // Obtener información de los referidos para cada incentivo
    const incentivosConReferidos = await Promise.all(
      incentivos.map(async (incentivo: typeof incentivos[number]) => {
        const referido = await prisma.referenciador.findUnique({
          where: { id: incentivo.referidoId },
          select: {
            id: true,
            nombre: true,
            codigo: true,
            correo: true,
            fechaRegistro: true
          }
        });

        return {
          ...incentivo,
          referido
        };
      })
    );

    // Obtener comisiones con información del referenciador que recibe y la solicitud que la generó
    const comisiones = await prisma.comision.findMany({
      include: {
        referenciador: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            correo: true
          }
        }
      },
      orderBy: {
        fechaGeneracion: 'desc'
      }
    });

    // Obtener información de las solicitudes de crédito para cada comisión
    const comisionesConSolicitudes = await Promise.all(
      comisiones.map(async (comision: typeof comisiones[number]) => {
        const solicitud = await prisma.solicitudCredito.findUnique({
          where: { id: comision.solicitudId },
          include: {
            referenciador: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                correo: true
              }
            }
          }
        });

        return {
          ...comision,
          solicitud
        };
      })
    );

    return NextResponse.json({
      incentivos: incentivosConReferidos,
      comisiones: comisionesConSolicitudes
    });

  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

