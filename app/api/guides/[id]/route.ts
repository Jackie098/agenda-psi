import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";
import { GuideStatus } from "@prisma/client";
import { z } from "zod";

const updateGuideSchema = z.object({
  expirationDate: z.string().datetime().optional(),
  status: z.enum(["EXPIRED"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { patientId } = await requirePatient();
    const body = await request.json();
    const data = updateGuideSchema.parse(body);

    // Verificar se a guia existe e pertence ao paciente
    const guide = await prisma.guide.findUnique({
      where: { id: params.id },
      include: {
        company: true,
      },
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

    const updateData: any = {};
    let shouldCreateLog = false;
    let logType: "GUIDE_CLOSED" | null = null;

    // Se estiver encerrando manualmente
    if (data.status === "EXPIRED") {
      updateData.status = GuideStatus.EXPIRED;
      shouldCreateLog = true;
      logType = "GUIDE_CLOSED";
    }

    // Se estiver atualizando a data
    if (data.expirationDate) {
      updateData.expirationDate = new Date(data.expirationDate);
    }

    // Atualizar guia
    const updatedGuide = await prisma.$transaction(async (tx) => {
      const updated = await tx.guide.update({
        where: { id: params.id },
        data: updateData,
        include: {
          company: true,
        },
      });

      // Se encerrou manualmente, criar log
      if (shouldCreateLog && logType) {
        await tx.activityLog.create({
          data: {
            type: logType,
            description: `Guia ${guide.number} encerrada manualmente`,
            metadata: {
              guideNumber: guide.number,
              company: guide.company.name,
              remainingCredits: guide.totalCredits - guide.usedCredits,
            },
            occurredAt: new Date(),
            patientId,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      message: "Guia atualizada com sucesso",
      guide: updatedGuide,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating guide:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar guia" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { patientId } = await requirePatient();

    // Verificar se a guia existe e pertence ao paciente
    const guide = await prisma.guide.findUnique({
      where: { id: params.id },
      include: {
        facialRecords: true,
      },
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

    // Verificar se tem faciais registradas
    if (guide.facialRecords.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir guia com faciais registradas" },
        { status: 400 }
      );
    }

    // Excluir guia
    await prisma.guide.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Guia excluída com sucesso",
    });
  } catch (error: any) {
    console.error("Error deleting guide:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao excluir guia" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

