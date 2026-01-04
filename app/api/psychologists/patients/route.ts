import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePsychologist } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const { psychologistId } = await requirePsychologist();

    const links = await prisma.patientPsychologistLink.findMany({
      where: {
        psychologistId,
        status: "ACCEPTED",
      },
      include: {
        patient: {
          include: {
            user: true,
            guides: {
              where: {
                status: "ACTIVE",
              },
            },
            sessions: {
              where: {
                psychologistId,
              },
              orderBy: {
                scheduledAt: "desc",
              },
              take: 5,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const patients = links.map((link) => ({
      id: link.patient.id,
      name: link.patient.user.name,
      email: link.patient.user.email,
      whatsapp: link.patient.user.whatsapp,
      balance: link.patient.balance,
      activeGuides: link.patient.guides.length,
      recentSessions: link.patient.sessions,
    }));

    return NextResponse.json(patients);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar pacientes" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

