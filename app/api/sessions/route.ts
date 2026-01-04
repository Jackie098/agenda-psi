import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { RegisteredBy, UserRole } from "@prisma/client";
import { z } from "zod";

const createSessionSchema = z.object({
  scheduledAt: z.string().datetime(),
  duration: z.enum(["30", "50"]).transform(Number),
  patientId: z.string().optional(), // Para psicólogo registrar consulta de paciente
  psychologistId: z.string().optional(), // Para paciente escolher psicólogo
  psychologistReferenceId: z.string().optional(), // Para paciente usar referência
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createSessionSchema.parse(body);

    const creditsUsed = data.duration === 30 ? 1 : 2;

    let patientId: string;
    let psychologistId: string | null = null;
    let psychologistReferenceId: string | null = null;
    let registeredBy: RegisteredBy;

    if (user.role === UserRole.PATIENT) {
      // Paciente registrando própria consulta
      if (!user.patientId) {
        return NextResponse.json(
          { error: "Patient profile not found" },
          { status: 400 }
        );
      }

      patientId = user.patientId;
      registeredBy = RegisteredBy.PATIENT;

      // Deve ter psicólogo OU referência
      if (data.psychologistId) {
        psychologistId = data.psychologistId;
      } else if (data.psychologistReferenceId) {
        psychologistReferenceId = data.psychologistReferenceId;
      } else {
        return NextResponse.json(
          { error: "Psicólogo ou referência deve ser informado" },
          { status: 400 }
        );
      }
    } else if (user.role === UserRole.PSYCHOLOGIST) {
      // Psicólogo registrando consulta de paciente
      if (!user.psychologistId) {
        return NextResponse.json(
          { error: "Psychologist profile not found" },
          { status: 400 }
        );
      }

      if (!data.patientId) {
        return NextResponse.json(
          { error: "Patient ID é obrigatório" },
          { status: 400 }
        );
      }

      patientId = data.patientId;
      psychologistId = user.psychologistId;
      registeredBy = RegisteredBy.PSYCHOLOGIST;
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    // Criar sessão e subtrair do saldo
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.session.create({
        data: {
          scheduledAt: new Date(data.scheduledAt),
          duration: data.duration,
          creditsUsed,
          patientId,
          psychologistId,
          psychologistReferenceId,
          registeredBy,
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
          psychologistReference: true,
        },
      });

      const patient = await tx.patient.update({
        where: { id: patientId },
        data: {
          balance: { decrement: creditsUsed },
        },
      });

      return { session, patient };
    });

    return NextResponse.json({
      ...result.session,
      newBalance: result.patient.balance,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Erro ao registrar sessão" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let sessions;

    if (user.role === UserRole.PATIENT && user.patientId) {
      sessions = await prisma.session.findMany({
        where: { patientId: user.patientId },
        include: {
          psychologist: {
            include: {
              user: true,
            },
          },
          psychologistReference: true,
        },
        orderBy: { scheduledAt: "desc" },
      });
    } else if (user.role === UserRole.PSYCHOLOGIST && user.psychologistId) {
      sessions = await prisma.session.findMany({
        where: { psychologistId: user.psychologistId },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { scheduledAt: "desc" },
      });
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    return NextResponse.json(sessions);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar sessões" },
      { status: 500 }
    );
  }
}

