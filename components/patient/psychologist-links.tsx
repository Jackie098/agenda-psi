"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestEmail, setRequestEmail] = useState("");
  const [requestWhatsapp, setRequestWhatsapp] = useState("");

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

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestEmail && !requestWhatsapp) {
      toast({
        title: "Erro",
        description: "Preencha email ou WhatsApp",
        variant: "destructive",
      });
      return;
    }

    setIsRequesting(true);

    try {
      const response = await fetch("/api/links/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: requestEmail || undefined,
          whatsapp: requestWhatsapp || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao solicitar vínculo",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: data.message || "Solicitação enviada!",
        description: data.status === "ACCEPTED" 
          ? "O psicólogo aceitou automaticamente o vínculo"
          : "Aguarde a resposta do psicólogo",
      });

      setRequestEmail("");
      setRequestWhatsapp("");
      fetchLinks();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao solicitar vínculo",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
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

      <Card>
        <CardHeader>
          <CardTitle>Solicitar Vínculo com Psicólogo</CardTitle>
          <CardDescription>
            Informe o email ou WhatsApp do psicólogo para solicitar vínculo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestLink} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="request-email">Email do Psicólogo</Label>
                <Input
                  id="request-email"
                  type="email"
                  placeholder="psicologo@example.com"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  disabled={isRequesting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-whatsapp">WhatsApp do Psicólogo</Label>
                <Input
                  id="request-whatsapp"
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={requestWhatsapp}
                  onChange={(e) => setRequestWhatsapp(e.target.value)}
                  disabled={isRequesting}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Preencha pelo menos um dos campos acima
            </p>
            <Button type="submit" disabled={isRequesting} className="w-full">
              {isRequesting ? "Solicitando..." : "Solicitar Vínculo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <h3 className="text-xl font-semibold">Vínculos Existentes</h3>
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

