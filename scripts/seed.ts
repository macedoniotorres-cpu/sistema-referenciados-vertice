
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Comenzando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.comision.deleteMany();
  await prisma.incentivo.deleteMany();
  await prisma.solicitudCredito.deleteMany();
  await prisma.referenciador.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Base de datos limpia.');

  // Crear usuario administrador
  const adminUser = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      name: 'Administrador Sistema'
    }
  });

  const adminPasswordHash = await bcrypt.hash('johndoe123', 10);
  
  const adminReferenciador = await prisma.referenciador.create({
    data: {
      codigo: 'ADMIN-001',
      nombre: 'Administrador Sistema',
      nss: '12345678901',
      nacimiento: new Date('1985-01-01'),
      telefono: '+52 55 1234 5678',
      correo: 'john@doe.com',
      password: adminPasswordHash,
      aceptarPublicidad: true,
      estatusRegistro: 'ACTIVO',
      tipoUsuario: 'ADMIN',
      userId: adminUser.id
    }
  });

  console.log('👑 Administrador creado:', adminReferenciador.correo);

  // Crear usuarios de referenciadores de ejemplo
  const referenciadores = [
    {
      nombre: 'María García López',
      nss: '11223344556',
      nacimiento: new Date('1990-03-15'),
      telefono: '+52 55 2345 6789',
      correo: 'maria.garcia@example.com',
      codigo: 'REF-202401-0001'
    },
    {
      nombre: 'Carlos Rodríguez Pérez',
      nss: '22334455667',
      nacimiento: new Date('1988-07-22'),
      telefono: '+52 55 3456 7890',
      correo: 'carlos.rodriguez@example.com',
      codigo: 'REF-202401-0002'
    },
    {
      nombre: 'Ana Martínez Hernández',
      nss: '33445566778',
      nacimiento: new Date('1992-11-08'),
      telefono: '+52 55 4567 8901',
      correo: 'ana.martinez@example.com',
      codigo: 'REF-202401-0003'
    },
    {
      nombre: 'Luis Fernández Gómez',
      nss: '44556677889',
      nacimiento: new Date('1987-05-30'),
      telefono: '+52 55 5678 9012',
      correo: 'luis.fernandez@example.com',
      codigo: 'REF-202401-0004'
    }
  ];

  const refPasswordHash = await bcrypt.hash('123456', 10);

  for (const refData of referenciadores) {
    const user = await prisma.user.create({
      data: {
        email: refData.correo,
        name: refData.nombre
      }
    });

    await prisma.referenciador.create({
      data: {
        ...refData,
        password: refPasswordHash,
        aceptarPublicidad: true,
        estatusRegistro: 'ACTIVO',
        tipoUsuario: 'REFERENCIADOR',
        userId: user.id
      }
    });

    console.log('👤 Referenciador creado:', refData.correo);
  }

  // Crear relación de referencia (María refiere a Carlos y Ana)
  const maria = await prisma.referenciador.findUnique({
    where: { correo: 'maria.garcia@example.com' }
  });
  const carlos = await prisma.referenciador.findUnique({
    where: { correo: 'carlos.rodriguez@example.com' }
  });
  const ana = await prisma.referenciador.findUnique({
    where: { correo: 'ana.martinez@example.com' }
  });

  if (maria && carlos && ana) {
    // Actualizar referenciador de Carlos y Ana
    await prisma.referenciador.update({
      where: { id: carlos.id },
      data: { referenciadorId: maria.id }
    });
    
    await prisma.referenciador.update({
      where: { id: ana.id },
      data: { referenciadorId: maria.id }
    });

    // Crear incentivos para María
    await prisma.incentivo.create({
      data: {
        referenciadorId: maria.id,
        referidoId: carlos.id,
        monto: 10.00,
        estado: 'PAGADO',
        fechaPago: new Date()
      }
    });

    await prisma.incentivo.create({
      data: {
        referenciadorId: maria.id,
        referidoId: ana.id,
        monto: 10.00,
        estado: 'PENDIENTE'
      }
    });

    console.log('🔗 Relaciones de referencia creadas.');
  }

  // Crear algunas solicitudes de crédito
  if (carlos && ana) {
    const solicitudCarlos = await prisma.solicitudCredito.create({
      data: {
        referenciadorId: carlos.id,
        monto: 50000.00,
        motivo: 'Compra de inmueble para inversión',
        estatus: 'APROBADO',
        fechaAprobacion: new Date(),
        comentarios: 'Crédito aprobado por cumplir todos los requisitos'
      }
    });

    await prisma.solicitudCredito.create({
      data: {
        referenciadorId: ana.id,
        monto: 35000.00,
        motivo: 'Renovación de vivienda',
        estatus: 'PENDIENTE'
      }
    });

    // Crear comisión para María por el crédito aprobado de Carlos
    if (maria) {
      await prisma.comision.create({
        data: {
          referenciadorId: maria.id,
          solicitudId: solicitudCarlos.id,
          monto: 500.00,
          estado: 'PENDIENTE'
        }
      });
    }

    console.log('💳 Solicitudes de crédito creadas.');
  }

  console.log('✅ Seed completado exitosamente!');
  console.log('');
  console.log('🔑 Credenciales de acceso:');
  console.log('👑 Admin: john@doe.com / johndoe123');
  console.log('👤 Referenciador: maria.garcia@example.com / 123456');
  console.log('👤 Referenciador: carlos.rodriguez@example.com / 123456');
  console.log('👤 Referenciador: ana.martinez@example.com / 123456');
  console.log('👤 Referenciador: luis.fernandez@example.com / 123456');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error durante el seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
