"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface PatientData {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  balance: number;
  guides: Array<{
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
  }>;
}

export function PatientSearch() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"email" | "whatsapp">("email");
  const [patientData, setPatientData] = useState<PatientData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPatientData(null);

    try {
      const params = new URLSearchParams();
      params.append(searchType, searchTerm);

      const response = await fetch(`/api/psychologists/patient?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao buscar paciente",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setPatientData(data);
      toast({
        title: "Paciente encontrado!",
        description: `${data.name} encontrado com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar paciente",
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
          <CardTitle>Buscar Paciente</CardTitle>
          <CardDescription>
            Busque um paciente vinculado por email ou WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="searchTerm">
                  {searchType === "email" ? "Email" : "WhatsApp"}
                </Label>
                <Input
                  id="searchTerm"
                  type={searchType === "email" ? "email" : "text"}
                  placeholder={
                    searchType === "email"
                      ? "paciente@email.com"
                      : "(00) 00000-0000"
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={searchType === "email" ? "default" : "outline"}
                    onClick={() => setSearchType("email")}
                  >
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={searchType === "whatsapp" ? "default" : "outline"}
                    onClick={() => setSearchType("whatsapp")}
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Buscando..." : "Buscar Paciente"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {patientData && (
        <Card>
          <CardHeader>
            <CardTitle>{patientData.name}</CardTitle>
            <CardDescription>
              {patientData.email} • {patientData.whatsapp}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className={`text-2xl font-bold ${patientData.balance < 0 ? "text-destructive" : "text-primary"}`}>
                  {patientData.balance} {patientData.balance === 1 ? "crédito" : "créditos"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Guias</p>
                <p className="text-2xl font-bold">{patientData.guides.length}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Guias do Paciente</h3>
              {patientData.guides.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma guia cadastrada</p>
              ) : (
                <div className="space-y-3">
                  {patientData.guides.map((guide) => (
                    <Card key={guide.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">Guia #{guide.number}</p>
                            <p className="text-sm text-muted-foreground">{guide.company.name}</p>
                          </div>
                          {getStatusBadge(guide.status)}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Usados</p>
                            <p className="font-medium">{guide.usedCredits}/{guide.totalCredits}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Disponíveis</p>
                            <p className="font-medium text-primary">{guide.availableCredits}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Validade</p>
                            <p className="font-medium">
                              {new Date(guide.expirationDate).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

