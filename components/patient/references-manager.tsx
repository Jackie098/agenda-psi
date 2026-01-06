"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Reference {
  id: string;
  name: string;
  linkedPsychologist?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
  _count?: {
    sessions: number;
  };
}

interface LinkedPsychologist {
  id: string;
  user: {
    name: string;
    email: string;
  };
}

export function ReferencesManager() {
  const { toast } = useToast();
  const [references, setReferences] = useState<Reference[]>([]);
  const [linkedPsychologists, setLinkedPsychologists] = useState<LinkedPsychologist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingReferenceId, setLinkingReferenceId] = useState<string | null>(null);
  const [selectedPsychologistId, setSelectedPsychologistId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar referências
      const referencesResponse = await fetch("/api/references");
      const referencesData = await referencesResponse.json();

      // Buscar psicólogos vinculados
      const linksResponse = await fetch("/api/links");
      const linksData = await linksResponse.json();

      if (referencesResponse.ok) {
        // Buscar contagem de sessões para cada referência
        const referencesWithCount = await Promise.all(
          referencesData.map(async (ref: Reference) => {
            const sessionsResponse = await fetch("/api/sessions");
            const sessionsData = await sessionsResponse.json();
            const count = sessionsResponse.ok 
              ? sessionsData.filter((s: any) => s.psychologistReferenceId === ref.id).length
              : 0;
            
            return {
              ...ref,
              _count: { sessions: count }
            };
          })
        );
        setReferences(referencesWithCount);
      }

      if (linksResponse.ok) {
        const acceptedLinks = linksData
          .filter((link: any) => link.status === "ACCEPTED")
          .map((link: any) => link.psychologist);
        setLinkedPsychologists(acceptedLinks);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkReference = async (referenceId: string) => {
    if (!selectedPsychologistId) {
      toast({
        title: "Erro",
        description: "Selecione um psicólogo",
        variant: "destructive",
      });
      return;
    }

    setLinkingReferenceId(referenceId);

    try {
      const response = await fetch(`/api/references/${referenceId}/link`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psychologistId: selectedPsychologistId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao vincular referência",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Referência vinculada!",
        description: data.message || "A referência foi vinculada ao psicólogo com sucesso",
      });

      setSelectedPsychologistId("");
      fetchData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao vincular referência",
        variant: "destructive",
      });
    } finally {
      setLinkingReferenceId(null);
    }
  };

  const handleUnlinkReference = async (referenceId: string) => {
    if (!confirm("Tem certeza que deseja desvincular esta referência? As consultas continuarão registradas.")) {
      return;
    }

    try {
      const response = await fetch(`/api/references/${referenceId}/link`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao desvincular",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Referência desvinculada",
        description: data.message || "O vínculo foi removido com sucesso",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao desvincular referência",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  const unlinkedReferences = references.filter(ref => !ref.linkedPsychologist);
  const linkedReferences = references.filter(ref => ref.linkedPsychologist);

  return (
    <div className="space-y-6">
      {linkedPsychologists.length === 0 && (
        <Alert>
          <AlertDescription>
            Você precisa ter vínculos aceitos com psicólogos para poder vincular referências.
          </AlertDescription>
        </Alert>
      )}

      {unlinkedReferences.length > 0 && linkedPsychologists.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Referências Não Vinculadas</h3>
            <p className="text-sm text-muted-foreground">
              Vincule suas referências aos psicólogos reais para manter o histórico organizado
            </p>
          </div>

          <div className="grid gap-4">
            {unlinkedReferences.map((reference) => (
              <Card key={reference.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{reference.name}</CardTitle>
                      <CardDescription>
                        {reference._count?.sessions || 0}{" "}
                        {reference._count?.sessions === 1 ? "consulta" : "consultas"} registradas
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Não vinculado</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Vincular ao psicólogo:
                    </label>
                    <Select
                      value={selectedPsychologistId}
                      onValueChange={setSelectedPsychologistId}
                      disabled={linkingReferenceId === reference.id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um psicólogo" />
                      </SelectTrigger>
                      <SelectContent>
                        {linkedPsychologists.map((psych) => (
                          <SelectItem key={psych.id} value={psych.id}>
                            {psych.user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => handleLinkReference(reference.id)}
                    disabled={linkingReferenceId === reference.id || !selectedPsychologistId}
                    className="w-full"
                  >
                    {linkingReferenceId === reference.id ? "Vinculando..." : "Vincular Referência"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {linkedReferences.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Referências Vinculadas</h3>
          
          <div className="grid gap-4">
            {linkedReferences.map((reference) => (
              <Card key={reference.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{reference.name}</CardTitle>
                      <CardDescription>
                        Vinculado a: {reference.linkedPsychologist?.user.name}
                      </CardDescription>
                    </div>
                    <Badge>Vinculado</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Psicólogo:</span>
                    <span className="font-medium">
                      {reference.linkedPsychologist?.user.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">
                      {reference.linkedPsychologist?.user.email}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Consultas:</span>
                    <span className="font-medium">
                      {reference._count?.sessions || 0}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleUnlinkReference(reference.id)}
                    className="w-full"
                  >
                    Desvincular
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {references.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma referência de psicólogo criada ainda.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

