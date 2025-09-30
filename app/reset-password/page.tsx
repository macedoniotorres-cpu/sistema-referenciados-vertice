

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertCircle, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de recuperación no válido');
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token de recuperación no válido');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    // Validaciones del lado del cliente
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        toast.success('Contraseña actualizada exitosamente');
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.message || 'Error al restablecer la contraseña');
        toast.error(data.message || 'Error al restablecer la contraseña');
      }
    } catch (error) {
      setError('Error de conexión');
      toast.error('Error de conexión');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Nueva Contraseña
          </CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña para completar la recuperación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {success}
                  <p className="text-sm mt-2">Serás redirigido al inicio de sesión...</p>
                </AlertDescription>
              </Alert>
            )}

            {!success && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="pl-10"
                      disabled={loading}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repite la contraseña"
                      required
                      className="pl-10"
                      disabled={loading}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={loading || !token}
                >
                  {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Button>
              </>
            )}

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio de sesión
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

