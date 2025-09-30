
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { generarCodigoReferenciador } from '@/lib/utils-referenciados';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nombre, 
      nss, 
      nacimiento, 
      telefono, 
      correo, 
      password, 
      aceptarPublicidad,
      codigoReferencia 
    } = body;

    // Validaciones básicas
    if (!nombre || !nss || !nacimiento || !telefono || !correo || !password) {
      return NextResponse.json(
        { message: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que el correo no esté registrado
    const existeCorreo = await prisma.referenciador.findUnique({
      where: { correo }
    });

    if (existeCorreo) {
      return NextResponse.json(
        { message: 'El correo ya está registrado' },
        { status: 400 }
      );
    }

    // Verificar código de referencia si se proporcionó
    let referenciadorId = null;
    if (codigoReferencia) {
      const referenciador = await prisma.referenciador.findUnique({
        where: { codigo: codigoReferencia }
      });

      if (!referenciador) {
        return NextResponse.json(
          { message: 'Código de referencia inválido' },
          { status: 400 }
        );
      }

      referenciadorId = referenciador.id;
    }

    // Generar código único
    let codigo = generarCodigoReferenciador();
    let codigoExiste = await prisma.referenciador.findUnique({
      where: { codigo }
    });

    // Regenerar hasta encontrar uno único
    while (codigoExiste) {
      codigo = generarCodigoReferenciador();
      codigoExiste = await prisma.referenciador.findUnique({
        where: { codigo }
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario de NextAuth primero
    const user = await prisma.user.create({
      data: {
        email: correo,
        name: nombre
      }
    });

    // Crear referenciador
    const nuevoReferenciador = await prisma.referenciador.create({
      data: {
        codigo,
        nombre,
        nss,
        nacimiento: new Date(nacimiento),
        telefono,
        correo,
        password: hashedPassword,
        aceptarPublicidad: Boolean(aceptarPublicidad),
        referenciadorId,
        userId: user.id
      }
    });

    // Si tiene referenciador, generar incentivo
    if (referenciadorId) {
      // El incentivo se generará cuando el nuevo referenciador sea aprobado
      // Por ahora solo guardamos la relación
    }

    return NextResponse.json(
      { 
        message: 'Registro exitoso. Tu registro está pendiente de aprobación.',
        codigo: nuevoReferenciador.codigo
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
