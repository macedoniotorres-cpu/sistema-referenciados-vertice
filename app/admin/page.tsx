
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
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
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  Shield,
  Eye,
  Check,
  X,
  Download,
  FileText,
  Printer,
  UserPlus,
  UserMinus,
  Crown,
  Banknote,
  Receipt,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatearMonto, formatearFecha } from '@/lib/utils-referenciados';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [referenciadores, setReferenciadores] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any>({ incentivos: [], comisiones: [] });
  const [passwordTokens, setPasswordTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const cargarDatos = useCallback(async () => {
    try {
      const [statsResponse, referenciadoressResponse, pagosResponse, passwordTokensResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/referenciadores'),
        fetch('/api/admin/pagos'),
        fetch('/api/admin/password-tokens')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (referenciadoressResponse.ok) {
        const referenciadoressData = await referenciadoressResponse.json();
        setReferenciadores(referenciadoressData);
      }

      if (pagosResponse.ok) {
        const pagosData = await pagosResponse.json();
        setPagos(pagosData);
      }

      if (passwordTokensResponse.ok) {
        const passwordTokensData = await passwordTokensResponse.json();
        setPasswordTokens(passwordTokensData);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (status === 'authenticated') {
      cargarDatos();
    }
  }, [session, status, router, cargarDatos]);

  const aprobarReferenciador = async (referenciadorId: string, aprobar: boolean) => {
    try {
      const response = await fetch('/api/admin/aprobar-referenciador', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referenciadorId, aprobar }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        cargarDatos(); // Recargar datos
      } else {
        toast.error(data.message || 'Error al procesar solicitud');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const aprobarCredito = async (solicitudId: string, aprobar: boolean, comentarios?: string) => {
    try {
      const response = await fetch('/api/admin/aprobar-credito', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ solicitudId, aprobar, comentarios }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        cargarDatos(); // Recargar datos
      } else {
        toast.error(data.message || 'Error al procesar solicitud');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const cambiarRol = async (referenciadorId: string, nuevoRol: 'ADMIN' | 'REFERENCIADOR') => {
    try {
      const response = await fetch('/api/admin/cambiar-rol', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referenciadorId, nuevoRol }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        cargarDatos(); // Recargar datos
      } else {
        toast.error(data.message || 'Error al cambiar rol');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const marcarPago = async (id: string, tipo: 'incentivo' | 'comision', pagado: boolean) => {
    try {
      const response = await fetch('/api/admin/marcar-pago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, tipo, pagado }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        cargarDatos(); // Recargar datos
      } else {
        toast.error(data.message || 'Error al marcar pago');
      }
    } catch (error) {
      toast.error('Error de conexión');
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

  const exportarReferenciadoresCSV = () => {
    try {
      // Crear headers del CSV
      const headers = [
        'Código',
        'Nombre',
        'Correo',
        'Teléfono',
        'Fecha Nacimiento',
        'Fecha Registro',
        'Estatus',
        'Referidos',
        'Solicitudes',
        'NSS'
      ];
      
      // Crear las filas de datos
      const rows = referenciadores.map((ref) => [
        ref.codigo,
        ref.nombre,
        ref.correo,
        ref.telefono,
        formatearFecha(new Date(ref.nacimiento)),
        formatearFecha(new Date(ref.fechaRegistro)),
        ref.estatusRegistro,
        ref.referidos.length.toString(),
        ref.solicitudesCredito.length.toString(),
        ref.nss
      ]);
      
      // Combinar headers y rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      // Crear y descargar el archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `referenciadores-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast.success('CSV exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      toast.error('Error al exportar el CSV');
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Lista de Referenciadores - Grupo Inmobiliario Vértice',
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Panel de Administrador
                </h1>
                <p className="text-sm text-gray-600">
                  Bienvenido, {session.user?.name}
                </p>
              </div>
            </div>
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Referenciadores
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReferenciadores}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.referenciadoresActivos} activos, {stats.referenciadorePendientes} pendientes
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Créditos
                </CardTitle>
                <CreditCard className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.creditosAprobados}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.creditosPendientes} pendientes de {stats.totalSolicitudesCredito} total
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monto Total Créditos
                </CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatearMonto(stats.montoTotalCreditos)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Créditos aprobados
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pagos Pendientes
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatearMonto(stats.totalIncentivos + stats.totalComisiones)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.incentivosPendientes + stats.comisionesPendientes} pagos pendientes
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="referenciadores" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="referenciadores">Usuarios</TabsTrigger>
            <TabsTrigger value="creditos">Créditos</TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
            <TabsTrigger value="tokens">🔐 Tokens</TabsTrigger>
          </TabsList>

          {/* Tab Referenciadores */}
          <TabsContent value="referenciadores">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestión de Usuarios</CardTitle>
                    <CardDescription>
                      Gestiona usuarios del sistema: aprobar registros, cambiar roles de referenciador a administrador
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={exportarReferenciadoresCSV}
                      variant="outline"
                      size="sm"
                      disabled={referenciadores.length === 0}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Exportar CSV</span>
                    </Button>
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      size="sm"
                      disabled={referenciadores.length === 0}
                      className="flex items-center space-x-2"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Imprimir</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent ref={printRef}>
                <div className="print:block hidden mb-6 text-center">
                  <h1 className="text-2xl font-bold">Lista de Referenciadores</h1>
                  <h2 className="text-lg text-gray-600">Grupo Inmobiliario Vértice</h2>
                  <p className="text-sm text-gray-500">Generado el: {formatearFecha(new Date())}</p>
                </div>
                {referenciadores.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No hay referenciadores registrados
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referenciadores.map((ref) => (
                      <div
                        key={ref.id}
                        className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-3">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="text-lg font-semibold">{ref.nombre}</h3>
                                  {ref.tipoUsuario === 'ADMIN' && (
                                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                                      <Crown className="h-3 w-3 mr-1" />
                                      ADMIN
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{ref.correo}</p>
                                <p className="text-xs text-gray-500">
                                  Código: {ref.codigo} | NSS: {ref.nss}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
                              <div>
                                <span className="font-medium">Teléfono:</span>
                                <p>{ref.telefono}</p>
                              </div>
                              <div>
                                <span className="font-medium">Fecha Nacimiento:</span>
                                <p>{formatearFecha(new Date(ref.nacimiento))}</p>
                              </div>
                              <div>
                                <span className="font-medium">Registro:</span>
                                <p>{formatearFecha(new Date(ref.fechaRegistro))}</p>
                              </div>
                              <div>
                                <span className="font-medium">Referidos:</span>
                                <p>{ref.referidos.length}</p>
                              </div>
                              <div>
                                <span className="font-medium">Solicitudes:</span>
                                <p>{ref.solicitudesCredito.length}</p>
                              </div>
                            </div>

                            {ref.referenciador && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                  <strong>Referido por:</strong> {ref.referenciador.nombre} ({ref.referenciador.codigo})
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end space-y-3">
                            <Badge className={getEstatusColor(ref.estatusRegistro)}>
                              {getEstatusIcon(ref.estatusRegistro)}
                              <span className="ml-1">{ref.estatusRegistro}</span>
                            </Badge>

                            {/* Botones de cambio de rol */}
                            {ref.estatusRegistro === 'ACTIVO' && (
                              <div className="flex flex-col space-y-2">
                                {ref.tipoUsuario === 'REFERENCIADOR' ? (
                                  <Button
                                    onClick={() => cambiarRol(ref.id, 'ADMIN')}
                                    size="sm"
                                    variant="outline"
                                    className="text-purple-700 border-purple-300 hover:bg-purple-50"
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Hacer Admin
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => cambiarRol(ref.id, 'REFERENCIADOR')}
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-700 border-blue-300 hover:bg-blue-50"
                                  >
                                    <UserMinus className="h-4 w-4 mr-1" />
                                    Quitar Admin
                                  </Button>
                                )}
                              </div>
                            )}

                            {ref.estatusRegistro === 'PENDIENTE' && (
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => aprobarReferenciador(ref.id, true)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Aprobar
                                </Button>
                                <Button
                                  onClick={() => aprobarReferenciador(ref.id, false)}
                                  size="sm"
                                  variant="destructive"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Rechazar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Créditos */}
          <TabsContent value="creditos">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Solicitudes de Crédito</CardTitle>
                <CardDescription>
                  Revisa y aprueba/rechaza solicitudes de crédito
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const solicitudes = referenciadores.flatMap(ref =>
                    ref.solicitudesCredito.map((sol: any) => ({
                      ...sol,
                      referenciador: ref
                    }))
                  ).sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());

                  return solicitudes.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No hay solicitudes de crédito
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {solicitudes.map((sol) => (
                        <div
                          key={sol.id}
                          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold">
                                    {formatearMonto(sol.monto)}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    Solicitado por: {sol.referenciador.nombre}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatearFecha(new Date(sol.fechaSolicitud))}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-3">
                                <span className="font-medium text-sm">Motivo:</span>
                                <p className="text-sm text-gray-700 mt-1">{sol.motivo}</p>
                              </div>

                              {sol.comentarios && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <span className="font-medium text-sm">Comentarios:</span>
                                  <p className="text-sm text-gray-700 mt-1">{sol.comentarios}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end space-y-3">
                              <Badge className={getEstatusColor(sol.estatus)}>
                                {getEstatusIcon(sol.estatus)}
                                <span className="ml-1">{sol.estatus}</span>
                              </Badge>

                              {sol.estatus === 'PENDIENTE' && (
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => aprobarCredito(sol.id, true, 'Crédito aprobado')}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Aprobar
                                  </Button>
                                  <Button
                                    onClick={() => aprobarCredito(sol.id, false, 'Crédito rechazado')}
                                    size="sm"
                                    variant="destructive"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Rechazar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Pagos */}
          <TabsContent value="pagos">
            <div className="space-y-6">
              {/* Incentivos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2 text-green-600" />
                    Incentivos por Referidos
                  </CardTitle>
                  <CardDescription>
                    Pagos de incentivos generados por nuevos registros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pagos.incentivos.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay incentivos registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pagos.incentivos.map((incentivo: any) => (
                        <div
                          key={incentivo.id}
                          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-green-600">
                                    {formatearMonto(incentivo.monto)}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    Para: {incentivo.referenciador.nombre} ({incentivo.referenciador.codigo})
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatearFecha(new Date(incentivo.fechaGeneracion))}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center text-sm text-green-800">
                                  <User className="h-4 w-4 mr-2" />
                                  <span className="font-medium">Generado por registro de:</span>
                                </div>
                                {incentivo.referido ? (
                                  <div className="mt-2">
                                    <p className="font-medium">{incentivo.referido.nombre}</p>
                                    <p className="text-xs text-green-600">
                                      Código: {incentivo.referido.codigo} | {incentivo.referido.correo}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      Registrado: {formatearFecha(new Date(incentivo.referido.fechaRegistro))}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-red-600 mt-1">Usuario no encontrado</p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end space-y-3">
                              <Badge className={incentivo.estado === 'PAGADO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {incentivo.estado === 'PAGADO' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
                                {incentivo.estado}
                              </Badge>

                              {incentivo.fechaPago && (
                                <p className="text-xs text-gray-500">
                                  Pagado: {formatearFecha(new Date(incentivo.fechaPago))}
                                </p>
                              )}

                              <div className="flex space-x-2">
                                {incentivo.estado === 'PENDIENTE' ? (
                                  <Button
                                    onClick={() => marcarPago(incentivo.id, 'incentivo', true)}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Marcar Pagado
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => marcarPago(incentivo.id, 'incentivo', false)}
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-700 border-orange-300 hover:bg-orange-50"
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Marcar Pendiente
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comisiones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Banknote className="h-5 w-5 mr-2 text-blue-600" />
                    Comisiones por Créditos
                  </CardTitle>
                  <CardDescription>
                    Pagos de comisiones generados por créditos aprobados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pagos.comisiones.length === 0 ? (
                    <div className="text-center py-8">
                      <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay comisiones registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pagos.comisiones.map((comision: any) => (
                        <div
                          key={comision.id}
                          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-blue-600">
                                    {formatearMonto(comision.monto)}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    Para: {comision.referenciador.nombre} ({comision.referenciador.codigo})
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatearFecha(new Date(comision.fechaGeneracion))}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center text-sm text-blue-800">
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  <span className="font-medium">Generado por crédito aprobado:</span>
                                </div>
                                {comision.solicitud ? (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium text-blue-900">{formatearMonto(comision.solicitud.monto)}</p>
                                        <p className="text-xs text-blue-600">
                                          Solicitante: {comision.solicitud.referenciador.nombre}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Código: {comision.solicitud.referenciador.codigo}
                                        </p>
                                      </div>
                                      <Badge className="bg-green-100 text-green-800">
                                        {comision.solicitud.estatus}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                      Motivo: {comision.solicitud.motivo}
                                    </p>
                                    {comision.solicitud.fechaAprobacion && (
                                      <p className="text-xs text-gray-600">
                                        Aprobado: {formatearFecha(new Date(comision.solicitud.fechaAprobacion))}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-red-600 mt-1">Solicitud no encontrada</p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end space-y-3">
                              <Badge className={comision.estado === 'PAGADO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {comision.estado === 'PAGADO' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
                                {comision.estado}
                              </Badge>

                              {comision.fechaPago && (
                                <p className="text-xs text-gray-500">
                                  Pagado: {formatearFecha(new Date(comision.fechaPago))}
                                </p>
                              )}

                              <div className="flex space-x-2">
                                {comision.estado === 'PENDIENTE' ? (
                                  <Button
                                    onClick={() => marcarPago(comision.id, 'comision', true)}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Marcar Pagado
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => marcarPago(comision.id, 'comision', false)}
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-700 border-orange-300 hover:bg-orange-50"
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Marcar Pendiente
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Tokens de Recuperación */}
          <TabsContent value="tokens">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  🔐 Tokens de Recuperación de Contraseña
                </CardTitle>
                <CardDescription>
                  Tokens generados para recuperación de contraseñas (solo modo desarrollo)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passwordTokens.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">🔐</div>
                    <p className="text-gray-500">No hay tokens de recuperación generados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {passwordTokens.map((token) => (
                      <div
                        key={token.id}
                        className={`p-6 border rounded-lg transition-colors ${
                          token.expirado ? 'bg-red-50 border-red-200' : 
                          token.usado ? 'bg-gray-50 border-gray-200' :
                          'bg-green-50 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-3">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  📧 {token.email}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Creado: {formatearFecha(new Date(token.createdAt))}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Expira: {formatearFecha(new Date(token.expires))}
                                </p>
                              </div>
                            </div>
                            
                            {!token.expirado && !token.usado && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-blue-800">
                                      🔗 Link de recuperación activo
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                      Tiempo restante: {token.tiempoRestante} minutos
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => window.open(token.resetLink, '_blank')}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    Abrir Link
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end space-y-2">
                            <Badge className={
                              token.expirado ? 'bg-red-100 text-red-800' :
                              token.usado ? 'bg-gray-100 text-gray-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {token.expirado ? '⏰ Expirado' :
                               token.usado ? '✅ Usado' : '🟢 Activo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
