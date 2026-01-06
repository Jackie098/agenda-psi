import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { RequestedBy, UserRole, LinkStatus } from "@prisma/client";
import { z } from "zod";

const requestLinkSchema = z.object({
  email: z.string().email().optional(),
  whatsapp: z.string().optional(),
}).refine((data) => data.email || data.whatsapp, {
  message: "Email ou WhatsApp deve ser fornecido",
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = requestLinkSchema.parse(body);

    // Buscar usuário alvo por email ou whatsapp
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.whatsapp ? [{ whatsapp: data.whatsapp }] : []),
        ],
      },
      include: {
        patient: true,
        psychologist: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Validação 1: Não pode vincular consigo mesmo
    if (targetUser.id === user.id) {
      return NextResponse.json(
        { error: "Você não pode criar vínculo consigo mesmo" },
        { status: 400 }
      );
    }

    // Validação 2: Verificar se é do tipo oposto
    let patientId: string;
    let psychologistId: string;
    let requestedBy: RequestedBy;

    if (user.role === UserRole.PATIENT && user.patientId) {
      // Paciente solicitando vínculo com psicólogo
      if (targetUser.role !== UserRole.PSYCHOLOGIST || !targetUser.psychologist) {
        return NextResponse.json(
          { error: "Usuário alvo deve ser um psicólogo" },
          { status: 400 }
        );
      }
      patientId = user.patientId;
      psychologistId = targetUser.psychologist.id;
      requestedBy = RequestedBy.PATIENT;
    } else if (user.role === UserRole.PSYCHOLOGIST && user.psychologistId) {
      // Psicólogo solicitando vínculo com paciente
      if (targetUser.role !== UserRole.PATIENT || !targetUser.patient) {
        return NextResponse.json(
          { error: "Usuário alvo deve ser um paciente" },
          { status: 400 }
        );
      }
      patientId = targetUser.patient.id;
      psychologistId = user.psychologistId;
      requestedBy = RequestedBy.PSYCHOLOGIST;
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    // Validação 3: Verificar se já existe vínculo
    const existingLink = await prisma.patientPsychologistLink.findUnique({
      where: {
        patientId_psychologistId: {
          patientId,
          psychologistId,
        },
      },
    });

    if (existingLink) {
      // Se já está aceito, retornar erro
      if (existingLink.status === LinkStatus.ACCEPTED) {
        return NextResponse.json(
          { error: "Vínculo já existe e está ativo" },
          { status: 400 }
        );
      }

      // Se está pendente do outro lado, aceitar automaticamente
      if (existingLink.status === LinkStatus.PENDING && existingLink.requestedBy !== requestedBy) {
        const updatedLink = await prisma.patientPsychologistLink.update({
          where: { id: existingLink.id },
          data: {
            status: LinkStatus.ACCEPTED,
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

        return NextResponse.json(
          {
            ...updatedLink,
            message: "Vínculo aceito automaticamente (solicitação mútua detectada)",
          },
          { status: 200 }
        );
      }

      // Se está pendente do mesmo lado, retornar erro
      if (existingLink.status === LinkStatus.PENDING) {
        return NextResponse.json(
          { error: "Já existe uma solicitação pendente com este usuário" },
          { status: 400 }
        );
      }

      // Se foi rejeitado recentemente (menos de 7 dias), não permitir
      if (existingLink.status === LinkStatus.REJECTED && existingLink.respondedAt) {
        const daysSinceRejection = Math.floor(
          (Date.now() - existingLink.respondedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceRejection < 7) {
          return NextResponse.json(
            { 
              error: `Solicitação foi rejeitada recentemente. Aguarde ${7 - daysSinceRejection} dias para tentar novamente` 
            },
            { status: 400 }
          );
        }

        // Se passou mais de 7 dias, deletar o vínculo antigo e criar novo
        await prisma.patientPsychologistLink.delete({
          where: { id: existingLink.id },
        });
      }
    }

    // Criar novo vínculo
    const newLink = await prisma.patientPsychologistLink.create({
      data: {
        patientId,
        psychologistId,
        requestedBy,
        status: LinkStatus.PENDING,
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

    return NextResponse.json(
      {
        ...newLink,
        message: "Solicitação de vínculo enviada com sucesso",
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Request link error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar solicitação de vínculo" },
      { status: 500 }
    );
  }
}

