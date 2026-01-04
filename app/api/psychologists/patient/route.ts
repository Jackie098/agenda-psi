import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePsychologist } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const { psychologistId } = await requirePsychologist();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const whatsapp = searchParams.get("whatsapp");

    if (!email && !whatsapp) {
      return NextResponse.json(
        { error: "Email ou WhatsApp deve ser fornecido" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(whatsapp ? [{ whatsapp }] : []),
        ],
        role: "PATIENT",
      },
      include: {
        patient: {
          include: {
            guides: {
              include: {
                company: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!user || !user.patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se há vínculo ACEITO
    const link = await prisma.patientPsychologistLink.findFirst({
      where: {
        patientId: user.patient.id,
        psychologistId,
        status: "ACCEPTED",
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Você não tem vínculo com este paciente" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: user.patient.id,
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp,
      balance: user.patient.balance,
      guides: user.patient.guides.map((guide) => ({
        id: guide.id,
        number: guide.number,
        totalCredits: guide.totalCredits,
        usedCredits: guide.usedCredits,
        availableCredits: guide.totalCredits - guide.usedCredits,
        expirationDate: guide.expirationDate,
        status: guide.status,
        company: guide.company,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar paciente" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

