import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const { patientId } = await requirePatient();

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { balance: true },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ balance: patient.balance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

