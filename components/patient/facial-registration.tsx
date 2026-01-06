"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FacialRegistrationProps {
  onSuccess?: () => void;
}

interface Guide {
  id: string;
  number: string;
  totalCredits: number;
  usedCredits: number;
  expirationDate: string;
  company: {
    name: string;
  };
  createdAt: string;
}

export function FacialRegistration({ onSuccess }: FacialRegistrationProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGuides, setIsFetchingGuides] = useState(true);
  const [activeGuides, setActiveGuides] = useState<Guide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string>("");

  useEffect(() => {
    fetchActiveGuides();
  }, []);

  const fetchActiveGuides = async () => {
    try {
      const response = await fetch("/api/guides");
      const data = await response.json();

      if (response.ok) {
        // Filtrar guias ativas com créditos disponíveis
        const available = data.filter(
          (guide: Guide) =>
            guide.usedCredits < guide.totalCredits &&
            new Date(guide.expirationDate) >= new Date() &&
            guide.usedCredits < guide.totalCredits
        );

        // Ordenar por data de criação (mais antiga primeiro - FIFO)
        const sorted = available.sort(
          (a: Guide, b: Guide) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        setActiveGuides(sorted);

        // Pré-selecionar a mais antiga
        if (sorted.length > 0) {
          setSelectedGuideId(sorted[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching guides:", error);
    } finally {
      setIsFetchingGuides(false);
    }
  };

  const handleRegisterFacial = async () => {
    setIsLoading(true);

    try {
      const body = activeGuides.length > 1 && selectedGuideId
        ? { guideId: selectedGuideId }
        : {}; // Se só tem uma guia ou nenhuma selecionada, deixa o sistema escolher

      const response = await fetch("/api/facials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao registrar facial",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data.warning) {
        toast({
          title: "Facial registrada com aviso",
          description: data.warning,
          variant: "default",
        });
      } else {
        toast({
          title: "Facial registrada!",
          description: `Novo saldo: ${data.balance} créditos`,
        });
      }

      // Recarregar guias após sucesso
      await fetchActiveGuides();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar facial",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingGuides) {
    return (
      <div className="space-y-2">
        <Button disabled className="w-full" size="lg">
          Carregando guias...
        </Button>
      </div>
    );
  }

  if (activeGuides.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Nenhuma guia ativa disponível. Adicione uma guia para registrar faciais.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {activeGuides.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="guide-select" className="text-xs">
            Escolha a guia (padrão: mais antiga)
          </Label>
          <Select value={selectedGuideId} onValueChange={setSelectedGuideId}>
            <SelectTrigger id="guide-select" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {activeGuides.map((guide, index) => (
                <SelectItem key={guide.id} value={guide.id}>
                  {index === 0 && "⭐ "}
                  Guia #{guide.number} - {guide.company.name} ({guide.totalCredits - guide.usedCredits} disponíveis)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        onClick={handleRegisterFacial}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "Registrando..." : "Bater Facial"}
      </Button>

      <p className="text-xs text-muted-foreground">
        +1 crédito no saldo
        {activeGuides.length > 1 && " • Usando guia selecionada"}
        {activeGuides.length === 1 && ` • Guia #${activeGuides[0].number}`}
      </p>
    </div>
  );
}

