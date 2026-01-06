"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock, 
  FileText, 
  XCircle, 
  CheckCircle, 
  Plus,
  Filter,
  X 
} from "lucide-react";

interface Activity {
  id: string;
  type: "FACIAL" | "SESSION" | "GUIDE_EXPIRED" | "GUIDE_CLOSED" | "GUIDE_CREATED";
  date: string;
  description: string;
  details: any;
}

const activityTypeLabels: Record<string, string> = {
  FACIAL: "Facial",
  SESSION: "Consulta",
  GUIDE_EXPIRED: "Guia Expirada",
  GUIDE_CLOSED: "Guia Encerrada",
  GUIDE_CREATED: "Guia Criada",
};

const activityTypeIcons: Record<string, any> = {
  FACIAL: CheckCircle,
  SESSION: Calendar,
  GUIDE_EXPIRED: XCircle,
  GUIDE_CLOSED: XCircle,
  GUIDE_CREATED: Plus,
};

const activityTypeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  FACIAL: "default",
  SESSION: "secondary",
  GUIDE_EXPIRED: "destructive",
  GUIDE_CLOSED: "destructive",
  GUIDE_CREATED: "outline",
};

interface ActivityTimelineProps {
  refreshTrigger?: number;
}

export function ActivityTimeline({ refreshTrigger }: ActivityTimelineProps) {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    types: [] as string[],
  });
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchActivities();
  }, [filters, refreshTrigger]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) {
        params.append("startDate", filters.startDate.toISOString());
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate.toISOString());
      }
      if (filters.types.length > 0) {
        params.append("type", filters.types.join(","));
      }

      const response = await fetch(`/api/activities?${params}`);
      const data = await response.json();

      if (response.ok) {
        setActivities(data);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível carregar atividades",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar atividades",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeFilterChange = (value: string) => {
    setSelectedTypeFilter(value);
    if (value === "all") {
      setFilters({ ...filters, types: [] });
    } else {
      setFilters({ ...filters, types: [value] });
    }
  };

  const clearFilters = () => {
    setFilters({ startDate: undefined, endDate: undefined, types: [] });
    setSelectedTypeFilter("all");
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.types.length > 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderActivityDetails = (activity: Activity) => {
    switch (activity.type) {
      case "FACIAL":
        return (
          <div className="text-sm text-muted-foreground mt-1">
            Guia #{activity.details.guide} • {activity.details.company} •{" "}
            <span className="text-green-600 font-medium">+{activity.details.credits} crédito</span>
          </div>
        );
      case "SESSION":
        return (
          <div className="text-sm text-muted-foreground mt-1">
            {activity.details.psychologist} • {activity.details.duration}min •{" "}
            <span className="text-red-600 font-medium">{activity.details.credits} créditos</span>
          </div>
        );
      case "GUIDE_EXPIRED":
        return (
          <div className="text-sm text-muted-foreground mt-1">
            Guia #{activity.details.guideNumber} • {activity.details.company} •{" "}
            {activity.details.remainingCredits} créditos restantes
          </div>
        );
      case "GUIDE_CLOSED":
        return (
          <div className="text-sm text-muted-foreground mt-1">
            Guia #{activity.details.guideNumber} • {activity.details.company} •{" "}
            {activity.details.remainingCredits} créditos perdidos
          </div>
        );
      case "GUIDE_CREATED":
        return (
          <div className="text-sm text-muted-foreground mt-1">
            Guia #{activity.details.guideNumber} • {activity.details.company} •{" "}
            {activity.details.totalCredits} créditos • Validade:{" "}
            {formatDate(activity.details.expirationDate)}
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading && activities.length === 0) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <DatePicker
                date={filters.startDate}
                onDateChange={(date) => setFilters({ ...filters, startDate: date })}
                placeholder="Selecione a data inicial"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <DatePicker
                date={filters.endDate}
                onDateChange={(date) => setFilters({ ...filters, endDate: date })}
                placeholder="Selecione a data final"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Atividade</Label>
              <Select value={selectedTypeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="FACIAL">Faciais</SelectItem>
                  <SelectItem value="SESSION">Consultas</SelectItem>
                  <SelectItem value="GUIDE_CREATED">Guias Criadas</SelectItem>
                  <SelectItem value="GUIDE_EXPIRED">Guias Expiradas</SelectItem>
                  <SelectItem value="GUIDE_CLOSED">Guias Encerradas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Histórico de Atividades</h2>
          <Badge variant="secondary">
            {activities.length} {activities.length === 1 ? "atividade" : "atividades"}
          </Badge>
        </div>

        {activities.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {hasActiveFilters
                ? "Nenhuma atividade encontrada com os filtros selecionados."
                : "Nenhuma atividade registrada ainda."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = activityTypeIcons[activity.type];
              return (
                <Card key={activity.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={activityTypeVariants[activity.type]}>
                                {activityTypeLabels[activity.type]}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(activity.date)} às {formatTime(activity.date)}
                              </span>
                            </div>
                            <p className="font-medium mt-1">{activity.description}</p>
                            {renderActivityDetails(activity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

