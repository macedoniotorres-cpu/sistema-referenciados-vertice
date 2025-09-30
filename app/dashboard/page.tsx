
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  LogOut,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  Share2,
  Wallet,
  TrendingDown,
  PiggyBank
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SolicitudCreditoForm } from '@/components/solicitud-credito-form';
import { formatearMonto, formatearFecha, generarLinkReferencia } from '@/lib/utils-referenciados';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [referidos, setReferidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      router.push('/admin');
      return;
    }

    if (status === 'authenticated') {
      cargarDatos();
    }
  }, [session, status, router]);

  const cargarDatos = async () => {
    try {
      const [statsResponse, referidosResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/referidos')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (referidosResponse.ok) {
        const referidosData = await referidosResponse.json();
        setReferidos(referidosData);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const copiarLinkReferencia = async () => {
    if (stats?.codigoReferencia) {
      const link = generarLinkReferencia(stats.codigoReferencia);
      try {
        await navigator.clipboard.writeText(link);
        toast.success('Link de referencia copiado al portapapeles');
      } catch (error) {
        toast.error('Error al copiar el link');
      }
    }
  };

  const compartirLink = async () => {
    if (stats?.codigoReferencia) {
      const link = generarLinkReferencia(stats.codigoReferencia);
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Únete al Sistema de Referenciados',
            text: '¡Regístrate usando mi código de referencia!',
            url: link,
          });
        } catch (error) {
          copiarLinkReferencia();
        }
      } else {
        copiarLinkReferencia();
      }
    }
  };

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'ACTIVO':
      case 'APROBADO':
        return 'bg-green-100 text-green-800';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstatusIcon = (estatus: string) => {
    switch (estatus) {
      case 'ACTIVO':
      case 'APROBADO':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDIENTE':
        return <Clock className="h-4 w-4" />;
      case 'RECHAZADO':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Panel de Referenciador
                </h1>
                <p className="text-sm text-gray-600">
                  Bienvenido, {session.user?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {stats?.codigoReferencia && (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={copiarLinkReferencia}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link
                  </Button>
                  <Button
                    onClick={compartirLink}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              )}
              <Button
                onClick={() => signOut({ callbackUrl: '/' })}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Alerta de estatus */}
        {stats?.estatusRegistro !== 'ACTIVO' && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Tu registro está <strong>{stats?.estatusRegistro?.toLowerCase()}</strong>. 
              Contacta al administrador para más información.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Referidos
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReferidos}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.referidosActivos} activos
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Incentivos
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatearMonto(stats.totalIncentivos)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.incentivosPendientes} pendientes
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Comisiones
                </CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatearMonto(stats.totalComisiones)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.comisionesPendientes} pendientes
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Créditos
                </CardTitle>
                <CreditCard className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.creditosAprobados}</div>
                <p className="text-xs text-muted-foreground">
                  de {stats.solicitudesCredito} solicitudes
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  💰 Ganancias Cobradas
                </CardTitle>
                <PiggyBank className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatearMonto(stats.totalGananciasCobradas || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total acumulado
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sección de Ganancias Cobradas */}
        {stats && stats.totalGananciasCobradas > 0 && (
          <Card className="mb-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <Wallet className="h-5 w-5 mr-2" />
                🎉 ¡Historial de Ganancias Cobradas!
              </CardTitle>
              <CardDescription className="text-green-700">
                Mira todo lo que has ganado hasta ahora como referenciador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-green-200">
                  <div className="flex justify-center items-center mb-2">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatearMonto(stats.incentivosCobrados || 0)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Incentivos por Referidos
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    $10 MXN por cada referido aprobado
                  </div>
                </div>

                <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-blue-200">
                  <div className="flex justify-center items-center mb-2">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatearMonto(stats.comisionesCobradas || 0)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Comisiones por Créditos
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    $500 MXN por cada crédito aprobado
                  </div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg shadow-sm border-2 border-yellow-300">
                  <div className="flex justify-center items-center mb-2">
                    <PiggyBank className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-700">
                    {formatearMonto(stats.totalGananciasCobradas)}
                  </div>
                  <div className="text-sm text-yellow-800 font-bold">
                    💰 TOTAL COBRADO
                  </div>
                  <div className="text-xs text-yellow-700 mt-1 font-medium">
                    ¡Sigue así para ganar más!
                  </div>
                </div>
              </div>
              
              <Alert className="mt-4 bg-green-50 border-green-200">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                  <strong>💡 Tip:</strong> Comparte tu código de referencia con más personas para seguir aumentando tus ganancias. 
                  ¡Cada referido aprobado te da $10 MXN y cada crédito aprobado $500 MXN!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="referidos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="referidos">Mis Referidos</TabsTrigger>
            <TabsTrigger value="credito">Solicitar Crédito</TabsTrigger>
            <TabsTrigger value="codigo">Mi Código</TabsTrigger>
          </TabsList>

          {/* Tab Referidos */}
          <TabsContent value="referidos">
            <Card>
              <CardHeader>
                <CardTitle>Mis Referidos</CardTitle>
                <CardDescription>
                  Lista de personas que has referido al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referidos.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Aún no has referido a nadie. ¡Comparte tu código para empezar!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referidos.map((referido) => (
                      <div
                        key={referido.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-semibold">{referido.nombre}</h3>
                              <p className="text-sm text-gray-600">{referido.correo}</p>
                              <p className="text-xs text-gray-500">
                                Código: {referido.codigo}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={getEstatusColor(referido.estatusRegistro)}>
                            {getEstatusIcon(referido.estatusRegistro)}
                            <span className="ml-1">{referido.estatusRegistro}</span>
                          </Badge>
                          {referido.solicitudesCredito.length > 0 && (
                            <Badge className={getEstatusColor(referido.estatusCredito)}>
                              Crédito: {referido.estatusCredito}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Solicitar Crédito */}
          <TabsContent value="credito">
            <SolicitudCreditoForm onSuccess={cargarDatos} />
          </TabsContent>

          {/* Tab Mi Código */}
          <TabsContent value="codigo">
            <Card>
              <CardHeader>
                <CardTitle>Mi Código de Referencia</CardTitle>
                <CardDescription>
                  Comparte este código o link para referir nuevos usuarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats?.codigoReferencia && (
                  <>
                    <div className="text-center">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                        <h3 className="text-2xl font-bold text-blue-600 mb-2">
                          {stats.codigoReferencia}
                        </h3>
                        <p className="text-gray-600">Tu código único de referencia</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Link de referencia:</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <input
                            type="text"
                            value={generarLinkReferencia(stats.codigoReferencia)}
                            readOnly
                            className="flex-1 p-2 border rounded-md bg-gray-50 text-sm"
                          />
                          <Button
                            onClick={copiarLinkReferencia}
                            size="sm"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={compartirLink}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartir Link
                        </Button>
                      </div>
                    </div>

                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Recuerda:</strong> Ganas $10 MXN por cada referenciado aprobado 
                        y $500 MXN por cada crédito aprobado de tus referidos.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
