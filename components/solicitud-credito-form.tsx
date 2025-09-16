
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SolicitudCreditoFormProps {
  onSuccess?: () => void;
}

export function SolicitudCreditoForm({ onSuccess }: SolicitudCreditoFormProps) {
  const [formData, setFormData] = useState({
    monto: '',
    motivo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validaciones
    const monto = parseFloat(formData.monto);
    if (isNaN(monto) || monto <= 0) {
      setError('El monto debe ser un número positivo');
      setLoading(false);
      return;
    }

    if (!formData.motivo.trim()) {
      setError('El motivo es obligatorio');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/credito/solicitar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('¡Solicitud de crédito enviada exitosamente!');
        toast.success('Solicitud enviada correctamente');
        setFormData({ monto: '', motivo: '' });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.message || 'Error al enviar la solicitud');
        toast.error(data.message || 'Error al enviar la solicitud');
      }
    } catch (error) {
      setError('Error de conexión');
      toast.error('Error de conexión');
    }

    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <CardTitle>Solicitar Crédito</CardTitle>
        </div>
        <CardDescription>
          Complete el formulario para solicitar un crédito
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
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="monto">Monto Solicitado (MXN)</Label>
            <div className="relative">
              <Input
                id="monto"
                name="monto"
                type="number"
                min="1"
                step="0.01"
                value={formData.monto}
                onChange={handleChange}
                required
                className="pl-10"
                placeholder="50000.00"
              />
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del Crédito</Label>
            <Textarea
              id="motivo"
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describe el motivo por el cual necesitas el crédito..."
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Nota:</strong> Tu solicitud será revisada por el equipo administrativo. 
              Recibirás una respuesta en un plazo máximo de 5 días hábiles.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
}
