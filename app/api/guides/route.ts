import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";
import { GuideStatus } from "@prisma/client";
import { z } from "zod";

const createGuideSchema = z.object({
  number: z.string().min(1),
  totalCredits: z.number().int().positive(),
  expirationDate: z.string().datetime(),
  companyId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { patientId } = await requirePatient();

    const guides = await prisma.guide.findMany({
      where: { patientId },
      include: {
        company: true,
        facialRecords: {
          orderBy: { recordedAt: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Atualizar status de guias expiradas
    const now = new Date();
    for (const guide of guides) {
      if (guide.status === GuideStatus.ACTIVE && guide.expirationDate < now) {
        await prisma.guide.update({
          where: { id: guide.id },
          data: { status: GuideStatus.EXPIRED },
        });
      }
    }

    return NextResponse.json(guides);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await requirePatient();
    const body = await request.json();
    const data = createGuideSchema.parse(body);

    // Verificar se o número da guia já existe
    const existingGuide = await prisma.guide.findUnique({
      where: { number: data.number },
    });

    if (existingGuide) {
      return NextResponse.json(
        { error: "Número de guia já cadastrado" },
        { status: 400 }
      );
    }

    const guide = await prisma.guide.create({
      data: {
        number: data.number,
        totalCredits: data.totalCredits,
        expirationDate: new Date(data.expirationDate),
        patientId,
        companyId: data.companyId,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json(guide);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Erro ao criar guia" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

