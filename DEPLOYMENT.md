
# Guía de Despliegue en Vercel

## Sistema de Referenciados - Grupo Inmobiliario Vértice

### 📋 Pre-requisitos

1. **Cuenta de Vercel** (gratuita en vercel.com)
2. **Base de datos PostgreSQL** (recomendado: Neon, Supabase, o PlanetScale)
3. **Código en GitHub/GitLab** (opcional pero recomendado)

### 🚀 Pasos para el Despliegue

#### 1. Preparar Base de Datos con Supabase

**Supabase (Recomendado - Gratuito y Completo)**
1. Ve a https://supabase.com
2. Crea una cuenta gratuita con GitHub/Google
3. Clic en "New Project"
4. Rellena:
   - **Organization**: Tu organización (o crea una nueva)
   - **Project Name**: `sistema-referenciados-vertice`
   - **Database Password**: Genera una contraseña segura (¡guárdala!)
   - **Region**: Elige la más cercana (ej: South America)
   - **Plan**: Free (2 proyectos gratis)
5. Espera 1-2 minutos mientras se crea el proyecto
6. Ve a **Settings** → **Database** → **Connection string**
7. Copia la **Connection string** (formato: postgresql://postgres:...)
8. Reemplaza `[YOUR-PASSWORD]` con la contraseña que estableciste

**Alternativa: Neon**
- Si prefieres Neon, ve a https://neon.tech y sigue pasos similares

#### 2. Variables de Entorno Necesarias

En tu proyecto de Vercel, configura estas variables:

```bash
# Base de datos
DATABASE_URL=postgresql://usuario:password@host:5432/database_name

# Autenticación NextAuth
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=tu_secret_muy_seguro_de_32_caracteres_minimo

# Opcional: Para modo desarrollo
NODE_ENV=production
```

#### 3. Despliegue desde GitHub (Recomendado)

1. **Crea un nuevo repositorio en GitHub:**
   - Ve a https://github.com/new
   - Repository name: `sistema-referenciados-vertice`
   - Descripción: `Sistema de Referenciados - Grupo Inmobiliario Vértice`
   - Public/Private: Tu elección
   - NO marques "Add a README file"
   - Crea el repositorio

2. **Sube el código a GitHub:**
   ```bash
   # Desde el directorio del proyecto
   cd /home/ubuntu/sistema_referenciados_simple/app
   git init
   git add .
   git commit -m "Sistema de referenciados completo"
   git branch -M main
   git remote add origin https://github.com/macedoniotorres-cpu/sistema-referenciados-vertice.git
   git push -u origin main
   ```

3. **Conecta con Vercel:**
   - Ve a https://vercel.com/dashboard
   - Clic en "New Project"
   - Conecta tu repositorio de GitHub
   - Selecciona el proyecto
   - Configura las variables de entorno
   - ¡Deploy!

#### 4. Despliegue Directo (Sin GitHub)

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Hacer login:**
   ```bash
   vercel login
   ```

3. **Desplegar:**
   ```bash
   cd /ruta/a/tu/proyecto
   vercel --prod
   ```

### 🔧 Configuración Post-Despliegue

#### 1. Migrar Base de Datos
Una vez desplegado, ejecuta las migraciones:

```bash
# Opción A: Desde tu computadora local
DATABASE_URL="tu_url_de_produccion" yarn prisma db push

# Opción B: Desde Vercel (usando Functions)
# Se ejecutará automáticamente en el primer despliegue
```

#### 2. Poblar Datos de Prueba
```bash
# Si quieres datos de ejemplo
DATABASE_URL="tu_url_de_produccion" yarn prisma db seed
```

### 📧 Configuración de Email (Opcional)

Para emails reales en producción, agrega:

```bash
# Variables adicionales para email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_de_app
```

### 🔐 Credenciales de Prueba

**Admin de prueba:**
- Email: `john@doe.com`
- Password: `johndoe123`

### 🎯 URLs Importantes

- **App Principal:** `https://tu-app.vercel.app`
- **Panel Admin:** `https://tu-app.vercel.app/admin`
- **Registro:** `https://tu-app.vercel.app/registro`
- **Login:** `https://tu-app.vercel.app/login`

### 🛠️ Troubleshooting

**Error de Base de Datos:**
- Verifica que DATABASE_URL esté correcta
- Asegúrate de que la DB esté accessible desde internet

**Error de Autenticación:**
- Verifica NEXTAUTH_URL (debe coincidir con tu dominio)
- Revisa que NEXTAUTH_SECRET tenga al menos 32 caracteres

**Build Errors:**
- Ejecuta `yarn build` localmente para verificar
- Revisa los logs en Vercel Dashboard

### ✅ Checklist de Despliegue

- [ ] Base de datos PostgreSQL configurada
- [ ] Variables de entorno configuradas en Vercel
- [ ] Código subido a GitHub (recomendado)
- [ ] Deploy exitoso en Vercel
- [ ] Migraciones de DB ejecutadas
- [ ] Prueba de login admin funcional
- [ ] URLs funcionando correctamente

### 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica variables de entorno
3. Asegúrate de que la base de datos esté accesible

---

¡Tu Sistema de Referenciados estará listo para producción! 🚀
