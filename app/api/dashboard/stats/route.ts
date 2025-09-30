
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

    const referenciador = await prisma.referenciador.findUnique({
      where: { id: session.user.referenciadorId },
      include: {
        referidos: true,
        solicitudesCredito: true,
        incentivos: true,
        comisiones: true
      }
    });

    if (!referenciador) {
      return NextResponse.json(
        { message: 'Referenciador no encontrado' },
        { status: 404 }
      );
    }

    // Calcular estadísticas
    const stats = {
      totalReferidos: referenciador.referidos.length,
      referidosActivos: referenciador.referidos.filter((r: typeof referenciador.referidos[number]) => r.estatusRegistro === 'ACTIVO').length,
      solicitudesCredito: referenciador.solicitudesCredito.length,
      creditosAprobados: referenciador.solicitudesCredito.filter((s: typeof referenciador.solicitudesCredito[number]) => s.estatus === 'APROBADO').length,
      totalIncentivos: referenciador.incentivos
        .filter((i: typeof referenciador.incentivos[number]) => i.estado === 'PENDIENTE')
        .reduce((sum: number, i: typeof referenciador.incentivos[number]) => sum + Number(i.monto), 0),
      incentivosPendientes: referenciador.incentivos.filter((i: typeof referenciador.incentivos[number]) => i.estado === 'PENDIENTE').length,
      totalComisiones: referenciador.comisiones
        .filter((c: typeof referenciador.comisiones[number]) => c.estado === 'PENDIENTE')
        .reduce((sum: number, c: typeof referenciador.comisiones[number]) => sum + Number(c.monto), 0),
      comisionesPendientes: referenciador.comisiones.filter((c: typeof referenciador.comisiones[number]) => c.estado === 'PENDIENTE').length,
      // Ganancias cobradas (PAGADAS)
      incentivosCobrados: referenciador.incentivos
        .filter((i: typeof referenciador.incentivos[number]) => i.estado === 'PAGADO')
        .reduce((sum: number, i: typeof referenciador.incentivos[number]) => sum + Number(i.monto), 0),
      comisionesCobradas: referenciador.comisiones
        .filter((c: typeof referenciador.comisiones[number]) => c.estado === 'PAGADO')
        .reduce((sum: number, c: typeof referenciador.comisiones[number]) => sum + Number(c.monto), 0),
      totalGananciasCobradas: referenciador.incentivos
        .filter((i: typeof referenciador.incentivos[number]) => i.estado === 'PAGADO')
        .reduce((sum: number, i: typeof referenciador.incentivos[number]) => sum + Number(i.monto), 0) +
        referenciador.comisiones
        .filter((c: typeof referenciador.comisiones[number]) => c.estado === 'PAGADO')
        .reduce((sum: number, c: typeof referenciador.comisiones[number]) => sum + Number(c.monto), 0),
      codigoReferencia: referenciador.codigo,
      estatusRegistro: referenciador.estatusRegistro,
      estatusCredito: referenciador.estatusCredito
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
