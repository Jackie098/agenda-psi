"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

interface FacialRecord {
  id: string;
  recordedAt: string;
  guide: {
    number: string;
    company: {
      name: string;
    };
  };
}

interface FacialsHistoryProps {
  refreshTrigger?: number;
}

export function FacialsHistory({ refreshTrigger }: FacialsHistoryProps) {
  const { toast } = useToast();
  const [facials, setFacials] = useState<FacialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFacials();
  }, [refreshTrigger]);

  const fetchFacials = async () => {
    try {
      const response = await fetch("/api/facials");
      const data = await response.json();

      if (response.ok) {
        setFacials(data);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível carregar histórico de faciais",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar histórico",
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
        <div>
          <h2 className="text-2xl font-bold">Histórico de Faciais</h2>
          <p className="text-sm text-muted-foreground">
            Registro completo de todas as faciais realizadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {facials.length} {facials.length === 1 ? "facial" : "faciais"}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchFacials}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {facials.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma facial registrada ainda. Bata sua primeira facial para começar a acumular créditos!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Registros</CardTitle>
            <CardDescription>
              Cada facial adiciona +1 crédito ao seu saldo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Guia</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facials.map((facial) => (
                  <TableRow key={facial.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {new Date(facial.recordedAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(facial.recordedAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        #{facial.guide.number}
                      </code>
                    </TableCell>
                    <TableCell>{facial.guide.company.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default" className="font-mono">
                        +1
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

