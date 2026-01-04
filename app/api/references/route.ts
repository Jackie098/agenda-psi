import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";
import { z } from "zod";

const createReferenceSchema = z.object({
  name: z.string().min(2),
});

export async function GET(request: NextRequest) {
  try {
    const { patientId } = await requirePatient();

    const references = await prisma.psychologistReference.findMany({
      where: { patientId },
      include: {
        linkedPsychologist: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(references);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await requirePatient();
    const body = await request.json();
    const data = createReferenceSchema.parse(body);

    const reference = await prisma.psychologistReference.create({
      data: {
        name: data.name,
        patientId,
      },
    });

    return NextResponse.json(reference);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Erro ao criar referência" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

