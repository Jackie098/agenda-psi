import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";
import { GuideStatus } from "@prisma/client";
import { z } from "zod";

const createFacialSchema = z.object({
  guideId: z.string().optional(), // Opcional: se não fornecido, usa FIFO
});

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await requirePatient();
    const body = await request.json();
    const data = createFacialSchema.parse(body);

    // Verificar se já existe facial hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const facialToday = await prisma.facialRecord.findFirst({
      where: {
        patientId,
        recordedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    let warning = null;
    if (facialToday) {
      warning = "Você já registrou uma facial hoje. Recomendamos apenas 1 por dia.";
    }

    // Selecionar guia
    let guideId = data.guideId;

    if (!guideId) {
      // Seleção automática: FIFO (guia mais antiga com créditos disponíveis)
      const availableGuide = await prisma.guide.findFirst({
        where: {
          patientId,
          status: GuideStatus.ACTIVE,
          usedCredits: {
            lt: prisma.guide.fields.totalCredits,
          },
          expirationDate: {
            gte: new Date(),
          },
        },
        orderBy: { createdAt: "asc" },
      });

      if (!availableGuide) {
        return NextResponse.json(
          { error: "Nenhuma guia ativa com créditos disponíveis encontrada" },
          { status: 400 }
        );
      }

      guideId = availableGuide.id;
    }

    // Verificar se a guia existe e tem créditos disponíveis
    const guide = await prisma.guide.findUnique({
      where: { id: guideId },
    });

    if (!guide) {
      return NextResponse.json({ error: "Guia não encontrada" }, { status: 404 });
    }

    if (guide.patientId !== patientId) {
      return NextResponse.json(
        { error: "Esta guia não pertence a você" },
        { status: 403 }
      );
    }

    if (guide.status !== GuideStatus.ACTIVE) {
      return NextResponse.json(
        { error: `Guia ${guide.status === GuideStatus.COMPLETED ? "completa" : "expirada"}` },
        { status: 400 }
      );
    }

    if (guide.usedCredits >= guide.totalCredits) {
      return NextResponse.json(
        { error: "Guia sem créditos disponíveis" },
        { status: 400 }
      );
    }

    if (guide.expirationDate < new Date()) {
      return NextResponse.json(
        { error: "Guia expirada" },
        { status: 400 }
      );
    }

    // Criar registro facial, incrementar créditos usados e saldo
    const result = await prisma.$transaction(async (tx) => {
      const facial = await tx.facialRecord.create({
        data: {
          patientId,
          guideId: guide.id,
          recordedAt: new Date(),
        },
      });

      const newUsedCredits = guide.usedCredits + 1;
      const newStatus =
        newUsedCredits >= guide.totalCredits
          ? GuideStatus.COMPLETED
          : guide.status;

      await tx.guide.update({
        where: { id: guide.id },
        data: {
          usedCredits: newUsedCredits,
          status: newStatus,
        },
      });

      const patient = await tx.patient.update({
        where: { id: patientId },
        data: {
          balance: { increment: 1 },
        },
      });

      return { facial, patient };
    });

    return NextResponse.json({
      ...result.facial,
      balance: result.patient.balance,
      warning,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Erro ao registrar facial" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { patientId } = await requirePatient();

    const facials = await prisma.facialRecord.findMany({
      where: { patientId },
      include: {
        guide: {
          include: {
            company: true,
          },
        },
      },
      orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json(facials);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

