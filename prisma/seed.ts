import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Criar empresas/convênios
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { name: "Unimed" },
      update: {},
      create: { name: "Unimed" },
    }),
    prisma.company.upsert({
      where: { name: "Amil" },
      update: {},
      create: { name: "Amil" },
    }),
    prisma.company.upsert({
      where: { name: "Bradesco Saúde" },
      update: {},
      create: { name: "Bradesco Saúde" },
    }),
    prisma.company.upsert({
      where: { name: "SulAmérica" },
      update: {},
      create: { name: "SulAmérica" },
    }),
  ]);

  console.log("✅ Empresas criadas:", companies.length);

  // Criar paciente de exemplo
  const patientUser = await prisma.user.upsert({
    where: { email: "paciente@example.com" },
    update: {},
    create: {
      name: "João Silva",
      email: "paciente@example.com",
      whatsapp: "11999999999",
      role: UserRole.PATIENT,
      patient: {
        create: {
          balance: 5,
        },
      },
    },
    include: { patient: true },
  });

  console.log("✅ Paciente criado:", patientUser.name);

  // Criar guia para o paciente
  if (patientUser.patient) {
    const guide = await prisma.guide.create({
      data: {
        number: "GUIA123456",
        totalCredits: 8,
        usedCredits: 3,
        expirationDate: new Date("2025-12-31"),
        patientId: patientUser.patient.id,
        companyId: companies[0].id,
      },
    });

    console.log("✅ Guia criada:", guide.number);

    // Criar registros faciais
    await prisma.facialRecord.createMany({
      data: [
        {
          patientId: patientUser.patient.id,
          guideId: guide.id,
          recordedAt: new Date("2025-01-01"),
        },
        {
          patientId: patientUser.patient.id,
          guideId: guide.id,
          recordedAt: new Date("2025-01-02"),
        },
        {
          patientId: patientUser.patient.id,
          guideId: guide.id,
          recordedAt: new Date("2025-01-03"),
        },
      ],
    });

    console.log("✅ Registros faciais criados");
  }

  // Criar psicólogo de exemplo
  const psychologistUser = await prisma.user.upsert({
    where: { email: "psicologo@example.com" },
    update: {},
    create: {
      name: "Dra. Maria Santos",
      email: "psicologo@example.com",
      whatsapp: "11988888888",
      role: UserRole.PSYCHOLOGIST,
      psychologist: {
        create: {},
      },
    },
    include: { psychologist: true },
  });

  console.log("✅ Psicólogo criado:", psychologistUser.name);

  // Criar vínculo entre paciente e psicólogo
  if (patientUser.patient && psychologistUser.psychologist) {
    const link = await prisma.patientPsychologistLink.create({
      data: {
        patientId: patientUser.patient.id,
        psychologistId: psychologistUser.psychologist.id,
        status: "ACCEPTED",
        requestedBy: "PATIENT",
        respondedAt: new Date(),
      },
    });

    console.log("✅ Vínculo criado");

    // Criar sessões de exemplo
    await prisma.session.createMany({
      data: [
        {
          scheduledAt: new Date("2024-12-15T10:00:00"),
          duration: 50,
          creditsUsed: 2,
          patientId: patientUser.patient.id,
          psychologistId: psychologistUser.psychologist.id,
          registeredBy: "PSYCHOLOGIST",
        },
        {
          scheduledAt: new Date("2024-12-22T14:00:00"),
          duration: 50,
          creditsUsed: 2,
          patientId: patientUser.patient.id,
          psychologistId: psychologistUser.psychologist.id,
          registeredBy: "PATIENT",
        },
      ],
    });

    console.log("✅ Sessões criadas");
  }

  // Criar referência de psicólogo
  if (patientUser.patient) {
    await prisma.psychologistReference.create({
      data: {
        name: "Dr. Pedro Costa",
        patientId: patientUser.patient.id,
      },
    });

    console.log("✅ Referência de psicólogo criada");
  }

  console.log("🎉 Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

