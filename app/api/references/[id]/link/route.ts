import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";
import { z } from "zod";

const linkReferenceSchema = z.object({
  psychologistId: z.string(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { patientId } = await requirePatient();
    const body = await request.json();
    const data = linkReferenceSchema.parse(body);

    // Verificar se a referência existe e pertence ao paciente
    const reference = await prisma.psychologistReference.findUnique({
      where: { id: params.id },
    });

    if (!reference) {
      return NextResponse.json(
        { error: "Referência não encontrada" },
        { status: 404 }
      );
    }

    if (reference.patientId !== patientId) {
      return NextResponse.json(
        { error: "Esta referência não pertence a você" },
        { status: 403 }
      );
    }

    // Verificar se a referência já está vinculada
    if (reference.linkedPsychologistId) {
      return NextResponse.json(
        { error: "Esta referência já está vinculada a um psicólogo" },
        { status: 400 }
      );
    }

    // Verificar se o psicólogo existe
    const psychologist = await prisma.psychologist.findUnique({
      where: { id: data.psychologistId },
      include: {
        user: true,
      },
    });

    if (!psychologist) {
      return NextResponse.json(
        { error: "Psicólogo não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se existe vínculo ACEITO entre paciente e psicólogo
    const link = await prisma.patientPsychologistLink.findFirst({
      where: {
        patientId,
        psychologistId: data.psychologistId,
        status: "ACCEPTED",
      },
    });

    if (!link) {
      return NextResponse.json(
        { 
          error: "Você precisa ter um vínculo aceito com este psicólogo antes de vincular a referência" 
        },
        { status: 400 }
      );
    }

    // Verificar se já existe outra referência vinculada a este psicólogo para este paciente
    const existingReference = await prisma.psychologistReference.findFirst({
      where: {
        patientId,
        linkedPsychologistId: data.psychologistId,
      },
    });

    if (existingReference && existingReference.id !== params.id) {
      return NextResponse.json(
        { 
          error: "Você já tem outra referência vinculada a este psicólogo" 
        },
        { status: 400 }
      );
    }

    // Atualizar a referência
    const updatedReference = await prisma.psychologistReference.update({
      where: { id: params.id },
      data: {
        linkedPsychologistId: data.psychologistId,
      },
      include: {
        linkedPsychologist: {
          include: {
            user: true,
          },
        },
      },
    });

    // Atualizar todas as sessões que usam esta referência para também incluir o psychologistId
    await prisma.session.updateMany({
      where: {
        psychologistReferenceId: params.id,
        psychologistId: null,
      },
      data: {
        psychologistId: data.psychologistId,
      },
    });

    return NextResponse.json({
      ...updatedReference,
      message: "Referência vinculada com sucesso! As consultas anteriores foram atualizadas.",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Link reference error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao vincular referência" },
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

    // Verificar se a referência existe e pertence ao paciente
    const reference = await prisma.psychologistReference.findUnique({
      where: { id: params.id },
    });

    if (!reference) {
      return NextResponse.json(
        { error: "Referência não encontrada" },
        { status: 404 }
      );
    }

    if (reference.patientId !== patientId) {
      return NextResponse.json(
        { error: "Esta referência não pertence a você" },
        { status: 403 }
      );
    }

    if (!reference.linkedPsychologistId) {
      return NextResponse.json(
        { error: "Esta referência não está vinculada a nenhum psicólogo" },
        { status: 400 }
      );
    }

    // Desvincular a referência
    const updatedReference = await prisma.psychologistReference.update({
      where: { id: params.id },
      data: {
        linkedPsychologistId: null,
      },
    });

    // Remover o psychologistId das sessões que usam apenas esta referência
    await prisma.session.updateMany({
      where: {
        psychologistReferenceId: params.id,
      },
      data: {
        psychologistId: null,
      },
    });

    return NextResponse.json({
      ...updatedReference,
      message: "Vínculo removido com sucesso",
    });
  } catch (error: any) {
    console.error("Unlink reference error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao desvincular referência" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

