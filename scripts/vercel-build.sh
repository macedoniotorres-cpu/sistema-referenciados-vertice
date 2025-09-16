
#!/bin/bash

# Script de construcción para Vercel
echo "🔧 Generando cliente Prisma..."
npx prisma generate

echo "🏗️ Construyendo aplicación Next.js..."
npm run build

echo "✅ Build completado para Vercel"
