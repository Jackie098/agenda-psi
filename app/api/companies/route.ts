import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCompanySchema = z.object({
  name: z.string().min(2),
});

export async function GET(request: NextRequest) {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(companies);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao buscar empresas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createCompanySchema.parse(body);

    const existingCompany = await prisma.company.findUnique({
      where: { name: data.name },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "Empresa já cadastrada" },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: { name: data.name },
    });

    return NextResponse.json(company);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar empresa" },
      { status: 500 }
    );
  }
}

