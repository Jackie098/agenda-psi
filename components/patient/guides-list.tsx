"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AddGuideDialog } from "./add-guide-dialog";

interface Guide {
  id: string;
  number: string;
  totalCredits: number;
  usedCredits: number;
  expirationDate: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
  company: {
    id: string;
    name: string;
  };
  facialRecords: Array<{
    id: string;
    recordedAt: string;
  }>;
}

export function GuidesList() {
  const { toast } = useToast();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const response = await fetch("/api/guides");
      const data = await response.json();

      if (response.ok) {
        setGuides(data);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível carregar guias",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar guias",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      ACTIVE: "default",
      COMPLETED: "secondary",
      EXPIRED: "destructive",
    };

    const labels: Record<string, string> = {
      ACTIVE: "Ativa",
      COMPLETED: "Completa",
      EXPIRED: "Expirada",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
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
        <h2 className="text-2xl font-bold">Minhas Guias</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          Adicionar Guia
        </Button>
      </div>

      {guides.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma guia cadastrada. Adicione sua primeira guia para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {guides.map((guide) => (
            <Card key={guide.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Guia #{guide.number}</CardTitle>
                    <CardDescription>{guide.company.name}</CardDescription>
                  </div>
                  {getStatusBadge(guide.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Créditos:</span>
                  <span className="font-medium">
                    {guide.usedCredits} / {guide.totalCredits} usados
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Disponíveis:</span>
                  <span className="font-medium text-primary">
                    {guide.totalCredits - guide.usedCredits} créditos
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Validade:</span>
                  <span className="font-medium">
                    {new Date(guide.expirationDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Faciais:</span>
                  <span className="font-medium">{guide.facialRecords.length}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddGuideDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          fetchGuides();
          setShowAddDialog(false);
        }}
      />
    </div>
  );
}

