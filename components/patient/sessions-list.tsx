"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AddSessionDialog } from "./add-session-dialog";

interface Session {
  id: string;
  scheduledAt: string;
  duration: number;
  creditsUsed: number;
  registeredBy: "PATIENT" | "PSYCHOLOGIST";
  psychologist?: {
    user: {
      name: string;
    };
  };
  psychologistReference?: {
    name: string;
  };
}

export function SessionsList() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();

      if (response.ok) {
        setSessions(data);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível carregar consultas",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar consultas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Minhas Consultas</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          Registrar Consulta
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma consulta registrada ainda.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Consultas</CardTitle>
            <CardDescription>
              Total: {sessions.length}{" "}
              {sessions.length === 1 ? "consulta" : "consultas"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Psicólogo</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Registrado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {new Date(session.scheduledAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {session.psychologist?.user.name ||
                        session.psychologistReference?.name}
                    </TableCell>
                    <TableCell>{session.duration} min</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{session.creditsUsed}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          session.registeredBy === "PATIENT"
                            ? "default"
                            : "outline"
                        }
                      >
                        {session.registeredBy === "PATIENT"
                          ? "Você"
                          : "Psicólogo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AddSessionDialog
        onSuccess={() => {
          fetchSessions();
        }}
      />
    </div>
  );
}
