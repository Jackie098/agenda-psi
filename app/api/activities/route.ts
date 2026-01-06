import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePatient } from "@/lib/auth-helpers";

interface Activity {
  id: string;
  type: "FACIAL" | "SESSION" | "GUIDE_EXPIRED" | "GUIDE_CLOSED" | "GUIDE_CREATED";
  date: string;
  description: string;
  details: any;
}

export async function GET(request: NextRequest) {
  try {
    const { patientId } = await requirePatient();
    const { searchParams } = new URL(request.url);

    // Pegar filtros
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const typesParam = searchParams.get("type");
    const types = typesParam ? typesParam.split(",") : [];

    // Construir filtros de data
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Incluir todo o dia
      dateFilter.lte = end;
    }

    const activities: Activity[] = [];

    // Buscar faciais se não houver filtro de tipo ou se FACIAL estiver nos tipos
    if (types.length === 0 || types.includes("FACIAL")) {
      const facials = await prisma.facialRecord.findMany({
        where: {
          patientId,
          ...(Object.keys(dateFilter).length > 0 && { recordedAt: dateFilter }),
        },
        include: {
          guide: {
            include: {
              company: true,
            },
          },
        },
        orderBy: { recordedAt: "desc" },
      });

      facials.forEach((facial) => {
        activities.push({
          id: facial.id,
          type: "FACIAL",
          date: facial.recordedAt.toISOString(),
          description: "Facial registrada",
          details: {
            guide: facial.guide.number,
            company: facial.guide.company.name,
            credits: +1,
          },
        });
      });
    }

    // Buscar sessões se não houver filtro de tipo ou se SESSION estiver nos tipos
    if (types.length === 0 || types.includes("SESSION")) {
      const sessions = await prisma.session.findMany({
        where: {
          patientId,
          ...(Object.keys(dateFilter).length > 0 && { scheduledAt: dateFilter }),
        },
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

      sessions.forEach((session) => {
        activities.push({
          id: session.id,
          type: "SESSION",
          date: session.scheduledAt.toISOString(),
          description: "Consulta realizada",
          details: {
            duration: session.duration,
            psychologist:
              session.psychologist?.user.name ||
              session.psychologistReference?.name ||
              "Não especificado",
            credits: -session.creditsUsed,
          },
        });
      });
    }

    // Buscar eventos de guias (ActivityLogs)
    const guideEventTypes = ["GUIDE_EXPIRED", "GUIDE_CLOSED", "GUIDE_CREATED"];
    const filteredGuideTypes = types.length === 0 
      ? guideEventTypes 
      : guideEventTypes.filter(t => types.includes(t));

    if (filteredGuideTypes.length > 0) {
      const activityLogs = await prisma.activityLog.findMany({
        where: {
          patientId,
          type: { in: filteredGuideTypes as any },
          ...(Object.keys(dateFilter).length > 0 && { occurredAt: dateFilter }),
        },
        orderBy: { occurredAt: "desc" },
      });

      activityLogs.forEach((log) => {
        activities.push({
          id: log.id,
          type: log.type as any,
          date: log.occurredAt.toISOString(),
          description: log.description,
          details: log.metadata,
        });
      });
    }

    // Ordenar por data (mais recente primeiro)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(activities);
  } catch (error: any) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar atividades" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

