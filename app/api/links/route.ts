import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { RequestedBy, UserRole } from "@prisma/client";
import { z } from "zod";

const createLinkSchema = z.object({
  targetId: z.string(), // patientId ou psychologistId dependendo de quem está criando
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let links;

    if (user.role === UserRole.PATIENT && user.patientId) {
      links = await prisma.patientPsychologistLink.findMany({
        where: { patientId: user.patientId },
        include: {
          psychologist: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (user.role === UserRole.PSYCHOLOGIST && user.psychologistId) {
      links = await prisma.patientPsychologistLink.findMany({
        where: { psychologistId: user.psychologistId },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    return NextResponse.json(links);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar vínculos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createLinkSchema.parse(body);

    let patientId: string;
    let psychologistId: string;
    let requestedBy: RequestedBy;

    if (user.role === UserRole.PATIENT && user.patientId) {
      patientId = user.patientId;
      psychologistId = data.targetId;
      requestedBy = RequestedBy.PATIENT;

      // Verificar se psicólogo existe
      const psychologist = await prisma.psychologist.findUnique({
        where: { id: psychologistId },
      });

      if (!psychologist) {
        return NextResponse.json(
          { error: "Psicólogo não encontrado" },
          { status: 404 }
        );
      }
    } else if (user.role === UserRole.PSYCHOLOGIST && user.psychologistId) {
      patientId = data.targetId;
      psychologistId = user.psychologistId;
      requestedBy = RequestedBy.PSYCHOLOGIST;

      // Verificar se paciente existe
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Paciente não encontrado" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    // Verificar se já existe vínculo
    const existingLink = await prisma.patientPsychologistLink.findUnique({
      where: {
        patientId_psychologistId: {
          patientId,
          psychologistId,
        },
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: "Vínculo já existe" },
        { status: 400 }
      );
    }

    const link = await prisma.patientPsychologistLink.create({
      data: {
        patientId,
        psychologistId,
        requestedBy,
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

    return NextResponse.json(link);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Erro ao criar vínculo" },
      { status: 500 }
    );
  }
}

