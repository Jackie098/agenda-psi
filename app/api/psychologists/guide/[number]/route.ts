import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePsychologist } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { psychologistId } = await requirePsychologist();

    const guide = await prisma.guide.findUnique({
      where: { number: (await params).number },
      include: {
        company: true,
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!guide) {
      return NextResponse.json(
        { error: "Guia não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o psicólogo tem vínculo ACEITO com o paciente
    const link = await prisma.patientPsychologistLink.findFirst({
      where: {
        patientId: guide.patient.id,
        psychologistId,
        status: "ACCEPTED",
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Você não tem acesso a esta guia" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: guide.id,
      number: guide.number,
      totalCredits: guide.totalCredits,
      usedCredits: guide.usedCredits,
      availableCredits: guide.totalCredits - guide.usedCredits,
      expirationDate: guide.expirationDate,
      status: guide.status,
      company: guide.company,
      patient: {
        id: guide.patient.id,
        name: guide.patient.user.name,
        email: guide.patient.user.email,
        balance: guide.patient.balance,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar guia" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
