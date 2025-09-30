
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

    // Obtener estadísticas generales
    const [
      totalReferenciadores,
      referenciadoresTotales,
      solicitudesCredito,
      incentivos,
      comisiones
    ] = await Promise.all([
      prisma.referenciador.count({
        where: { tipoUsuario: 'REFERENCIADOR' }
      }),
      prisma.referenciador.findMany({
        where: { tipoUsuario: 'REFERENCIADOR' },
        select: {
          estatusRegistro: true,
          estatusCredito: true
        }
      }),
      prisma.solicitudCredito.findMany({
        select: {
          estatus: true,
          monto: true
        }
      }),
      prisma.incentivo.findMany({
        select: {
          estado: true,
          monto: true
        }
      }),
      prisma.comision.findMany({
        select: {
          estado: true,
          monto: true
        }
      })
    ]);

    const stats = {
      totalReferenciadores,
      referenciadoresActivos: referenciadoresTotales.filter(r => r.estatusRegistro === 'ACTIVO').length,
      referenciadorePendientes: referenciadoresTotales.filter(r => r.estatusRegistro === 'PENDIENTE').length,
      totalSolicitudesCredito: solicitudesCredito.length,
      creditosAprobados: solicitudesCredito.filter(s => s.estatus === 'APROBADO').length,
      creditosPendientes: solicitudesCredito.filter(s => s.estatus === 'PENDIENTE').length,
      montoTotalCreditos: solicitudesCredito
        .filter(s => s.estatus === 'APROBADO')
        .reduce((sum, s) => sum + Number(s.monto), 0),
      totalIncentivos: incentivos
        .filter(i => i.estado === 'PENDIENTE')
        .reduce((sum, i) => sum + Number(i.monto), 0),
      incentivosPendientes: incentivos.filter(i => i.estado === 'PENDIENTE').length,
      totalComisiones: comisiones
        .filter(c => c.estado === 'PENDIENTE')
        .reduce((sum, c) => sum + Number(c.monto), 0),
      comisionesPendientes: comisiones.filter(c => c.estado === 'PENDIENTE').length
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error obteniendo estadísticas de admin:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
