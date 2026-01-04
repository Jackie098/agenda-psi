import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  whatsapp: z.string().min(10),
  role: z.nativeEnum(UserRole),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Verificar se email ou whatsapp já existem
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { whatsapp: data.whatsapp }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email ou WhatsApp já cadastrado" },
        { status: 400 }
      );
    }

    // Criar usuário e perfil correspondente
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp,
        role: data.role,
        ...(data.role === UserRole.PATIENT
          ? {
              patient: {
                create: {
                  balance: 0,
                },
              },
            }
          : {
              psychologist: {
                create: {},
              },
            }),
      },
      include: {
        patient: true,
        psychologist: true,
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      patientId: user.patient?.id,
      psychologistId: user.psychologist?.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}

