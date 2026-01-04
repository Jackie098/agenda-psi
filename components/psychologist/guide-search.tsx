"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface GuideData {
  id: string;
  number: string;
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  expirationDate: string;
  status: string;
  company: {
    name: string;
  };
  patient: {
    id: string;
    name: string;
    email: string;
    balance: number;
  };
}

export function GuideSearch() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [guideNumber, setGuideNumber] = useState("");
  const [guideData, setGuideData] = useState<GuideData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGuideData(null);

    try {
      const response = await fetch(`/api/psychologists/guide/${guideNumber}`);
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao buscar guia",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setGuideData(data);
      toast({
        title: "Guia encontrada!",
        description: `Guia #${data.number} encontrada`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar guia",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buscar Guia por Número</CardTitle>
          <CardDescription>
            Consulte informações de uma guia específica (apenas de pacientes vinculados)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guideNumber">Número da Guia</Label>
              <Input
                id="guideNumber"
                placeholder="Ex: 123456"
                value={guideNumber}
                onChange={(e) => setGuideNumber(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Buscando..." : "Buscar Guia"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {guideData && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Guia #{guideData.number}</CardTitle>
                <CardDescription>{guideData.company.name}</CardDescription>
              </div>
              {getStatusBadge(guideData.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de Créditos</p>
                <p className="text-2xl font-bold">{guideData.totalCredits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Créditos Usados</p>
                <p className="text-2xl font-bold">{guideData.usedCredits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
                <p className="text-2xl font-bold text-primary">{guideData.availableCredits}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Data de Validade</p>
              <p className="text-lg font-medium">
                {new Date(guideData.expirationDate).toLocaleDateString("pt-BR")}
              </p>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Informações do Paciente</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nome:</span>
                  <span className="font-medium">{guideData.patient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{guideData.patient.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Saldo Atual:</span>
                  <span className={`font-medium ${guideData.patient.balance < 0 ? "text-destructive" : "text-primary"}`}>
                    {guideData.patient.balance} {guideData.patient.balance === 1 ? "crédito" : "créditos"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

