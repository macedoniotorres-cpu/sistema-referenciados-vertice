
/**
 * Genera un código único para referenciador
 * Formato: REF-YYYYMM-XXXX (donde XXXX es un número aleatorio)
 */
export function generarCodigoReferenciador(): string {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const numero = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `REF-${año}${mes}-${numero}`;
}

/**
 * Genera el link único de referencia para un referenciador
 */
export function generarLinkReferencia(codigo: string): string {
  // En el cliente, usar window.location.origin; en el servidor, usar NEXTAUTH_URL
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/registro?ref=${codigo}`;
}

/**
 * Formatea montos en pesos mexicanos
 */
export function formatearMonto(monto: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(monto);
}

/**
 * Formatea fechas en español
 */
export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(fecha);
}

/**
 * Calcula la edad basada en fecha de nacimiento
 */
export function calcularEdad(nacimiento: Date): number {
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}
