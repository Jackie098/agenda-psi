"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FacialRegistrationProps {
  onSuccess?: () => void;
}

export function FacialRegistration({ onSuccess }: FacialRegistrationProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterFacial = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/facials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Sistema seleciona guia automaticamente (FIFO)
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

  return (
    <div className="space-y-2">
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
      </p>
    </div>
  );
}

