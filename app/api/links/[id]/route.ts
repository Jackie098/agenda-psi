import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { LinkStatus, UserRole } from "@prisma/client";
import { z } from "zod";

const updateLinkSchema = z.object({
  status: z.nativeEnum(LinkStatus),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateLinkSchema.parse(body);

    const link = await prisma.patientPsychologistLink.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Vínculo não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão para aceitar/rejeitar
    let canUpdate = false;

    if (user.role === UserRole.PATIENT && user.patientId === link.patientId) {
      // Paciente só pode responder se psicólogo solicitou
      canUpdate = link.requestedBy === "PSYCHOLOGIST";
    } else if (
      user.role === UserRole.PSYCHOLOGIST &&
      user.psychologistId === link.psychologistId
    ) {
      // Psicólogo só pode responder se paciente solicitou
      canUpdate = link.requestedBy === "PATIENT";
    }

    if (!canUpdate) {
      return NextResponse.json(
        { error: "Você não tem permissão para atualizar este vínculo" },
        { status: 403 }
      );
    }

    const updatedLink = await prisma.patientPsychologistLink.update({
      where: { id },
      data: {
        status: data.status,
        respondedAt: new Date(),
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        psychologist: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(updatedLink);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Erro ao atualizar vínculo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const link = await prisma.patientPsychologistLink.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Vínculo não encontrado" },
        { status: 404 }
      );
    }

    // Qualquer uma das partes pode deletar o vínculo
    const canDelete =
      (user.role === UserRole.PATIENT && user.patientId === link.patientId) ||
      (user.role === UserRole.PSYCHOLOGIST &&
        user.psychologistId === link.psychologistId);

    if (!canDelete) {
      return NextResponse.json(
        { error: "Você não tem permissão para deletar este vínculo" },
        { status: 403 }
      );
    }

    await prisma.patientPsychologistLink.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao deletar vínculo" },
      { status: 500 }
    );
  }
}

