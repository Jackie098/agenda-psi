"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Link {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  requestedBy: "PATIENT" | "PSYCHOLOGIST";
  createdAt: string;
  respondedAt?: string;
  psychologist: {
    user: {
      name: string;
      email: string;
    };
  };
}

export function PsychologistLinks() {
  const { toast } = useToast();
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await fetch("/api/links");
      const data = await response.json();

      if (response.ok) {
        setLinks(data);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível carregar vínculos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar vínculos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondLink = async (linkId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: status === "ACCEPTED" ? "Vínculo aceito!" : "Vínculo rejeitado",
        description: status === "ACCEPTED" 
          ? "Agora o psicólogo pode acessar suas informações"
          : "O vínculo foi rejeitado",
      });

      fetchLinks();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao responder solicitação",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Tem certeza que deseja remover este vínculo?")) return;

    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Vínculo removido",
        description: "O vínculo foi removido com sucesso",
      });

      fetchLinks();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover vínculo",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      PENDING: "secondary",
      ACCEPTED: "default",
      REJECTED: "destructive",
    };

    const labels: Record<string, string> = {
      PENDING: "Pendente",
      ACCEPTED: "Aceito",
      REJECTED: "Rejeitado",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meus Psicólogos</h2>
      </div>

      {links.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum vínculo com psicólogos ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {links.map((link) => (
            <Card key={link.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {link.psychologist.user.name}
                    </CardTitle>
                    <CardDescription>{link.psychologist.user.email}</CardDescription>
                  </div>
                  {getStatusBadge(link.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Solicitado por:</span>
                  <span className="font-medium">
                    {link.requestedBy === "PATIENT" ? "Você" : "Psicólogo"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">
                    {new Date(link.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                {link.status === "PENDING" && link.requestedBy === "PSYCHOLOGIST" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespondLink(link.id, "ACCEPTED")}
                      className="flex-1"
                    >
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespondLink(link.id, "REJECTED")}
                      className="flex-1"
                    >
                      Rejeitar
                    </Button>
                  </div>
                )}

                {link.status === "ACCEPTED" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteLink(link.id)}
                    className="w-full"
                  >
                    Remover Vínculo
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

