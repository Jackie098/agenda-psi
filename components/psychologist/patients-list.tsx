"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  balance: number;
  activeGuides: number;
  recentSessions: Array<{
    id: string;
    scheduledAt: string;
    duration: number;
  }>;
}

export function PatientsList() {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/psychologists/patients");
      const data = await response.json();

      if (response.ok) {
        setPatients(data);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível carregar pacientes",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar pacientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pacientes Vinculados</h2>
        <Badge variant="secondary">
          {patients.length} {patients.length === 1 ? "paciente" : "pacientes"}
        </Badge>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum paciente vinculado ainda. Aguarde solicitações de vínculo ou busque pacientes.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {patients.map((patient) => (
            <Card key={patient.id}>
              <CardHeader>
                <CardTitle className="text-lg">{patient.name}</CardTitle>
                <CardDescription>
                  {patient.email} • {patient.whatsapp}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo:</span>
                  <span className={`font-medium ${patient.balance < 0 ? "text-destructive" : "text-primary"}`}>
                    {patient.balance} {patient.balance === 1 ? "crédito" : "créditos"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Guias Ativas:</span>
                  <span className="font-medium">{patient.activeGuides}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Consultas Recentes:</span>
                  <span className="font-medium">{patient.recentSessions.length}</span>
                </div>
                {patient.recentSessions.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Última consulta:</p>
                    <p className="text-sm">
                      {new Date(patient.recentSessions[0].scheduledAt).toLocaleDateString("pt-BR")} •{" "}
                      {patient.recentSessions[0].duration} min
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

