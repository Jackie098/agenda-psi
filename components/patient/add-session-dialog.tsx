"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AddSessionDialogProps {
  onSuccess?: () => void;
}

interface Reference {
  id: string;
  name: string;
  linkedPsychologist?: {
    id: string;
    user: {
      name: string;
    };
  };
}

interface LinkedPsychologist {
  id: string;
  user: {
    name: string;
  };
}

interface PsychologistOption {
  id: string;
  name: string;
  type: "psychologist" | "reference";
  psychologistId?: string;
  referenceId?: string;
}

export function AddSessionDialog({ onSuccess }: AddSessionDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [references, setReferences] = useState<Reference[]>([]);
  const [linkedPsychologists, setLinkedPsychologists] = useState<LinkedPsychologist[]>([]);
  const [psychologistOptions, setPsychologistOptions] = useState<PsychologistOption[]>([]);
  const [showNewReference, setShowNewReference] = useState(false);
  const [newReferenceName, setNewReferenceName] = useState("");
  const [formData, setFormData] = useState({
    scheduledAt: "",
    duration: "50",
    selectedOption: "", // ID da opção selecionada
  });

  useEffect(() => {
    if (open) {
      fetchData();
      // Set default date/time to now
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setFormData((prev) => ({
        ...prev,
        scheduledAt: now.toISOString().slice(0, 16),
      }));
    }
  }, [open]);

  const fetchData = async () => {
    try {
      // Buscar referências
      const referencesResponse = await fetch("/api/references");
      const referencesData = await referencesResponse.json();

      // Buscar vínculos aceitos
      const linksResponse = await fetch("/api/links");
      const linksData = await linksResponse.json();

      if (referencesResponse.ok) {
        setReferences(referencesData);
      }

      if (linksResponse.ok) {
        const acceptedLinks = linksData.filter((link: any) => link.status === "ACCEPTED");
        const psychologists = acceptedLinks.map((link: any) => link.psychologist);
        setLinkedPsychologists(psychologists);
      }

      // Montar lista de opções evitando duplicatas
      if (referencesResponse.ok && linksResponse.ok) {
        buildPsychologistOptions(referencesData, linksData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const buildPsychologistOptions = (refs: Reference[], links: any[]) => {
    const options: PsychologistOption[] = [];
    const acceptedLinks = links.filter((link: any) => link.status === "ACCEPTED");
    const linkedPsychIds = new Set<string>();

    // Adicionar psicólogos vinculados reais
    acceptedLinks.forEach((link: any) => {
      linkedPsychIds.add(link.psychologist.id);
      options.push({
        id: `psych-${link.psychologist.id}`,
        name: link.psychologist.user.name,
        type: "psychologist",
        psychologistId: link.psychologist.id,
      });
    });

    // Adicionar referências que NÃO estão vinculadas a psicólogos reais
    refs.forEach((ref) => {
      if (!ref.linkedPsychologist || !linkedPsychIds.has(ref.linkedPsychologist.id)) {
        options.push({
          id: `ref-${ref.id}`,
          name: ref.name,
          type: "reference",
          referenceId: ref.id,
        });
      }
    });

    setPsychologistOptions(options);
  };

  const handleCreateReference = async () => {
    if (!newReferenceName.trim()) return;

    try {
      const response = await fetch("/api/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newReferenceName }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchData(); // Recarregar dados
        setFormData({ ...formData, selectedOption: `ref-${data.id}` });
        setNewReferenceName("");
        setShowNewReference(false);
        toast({
          title: "Referência criada!",
          description: `Psicólogo ${newReferenceName} adicionado`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar referência",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Encontrar a opção selecionada
      const selectedOption = psychologistOptions.find(opt => opt.id === formData.selectedOption);
      
      if (!selectedOption) {
        toast({
          title: "Erro",
          description: "Selecione um psicólogo",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Preparar dados baseado no tipo
      const sessionData: any = {
        duration: formData.duration,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      };

      if (selectedOption.type === "psychologist") {
        sessionData.psychologistId = selectedOption.psychologistId;
      } else {
        sessionData.psychologistReferenceId = selectedOption.referenceId;
      }

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao registrar consulta",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Consulta registrada!",
        description: `${data.creditsUsed} crédito(s) subtraído(s). Novo saldo: ${data.newBalance}`,
      });

      setFormData({
        scheduledAt: "",
        duration: "50",
        selectedOption: "",
      });

      onSuccess?.();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar consulta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        Registrar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Consulta</DialogTitle>
          <DialogDescription>
            Registre uma consulta realizada para subtrair créditos do seu saldo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Data e Hora da Consulta</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData({ ...formData, duration: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos (1 crédito)</SelectItem>
                <SelectItem value="50">50 minutos (2 créditos)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="selectedOption">Psicólogo</Label>
            {!showNewReference ? (
              <>
                <Select
                  value={formData.selectedOption}
                  onValueChange={(value) =>
                    setFormData({ ...formData, selectedOption: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o psicólogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {psychologistOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                        {option.type === "psychologist" && " ✓"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  ✓ = Psicólogo vinculado
                </p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setShowNewReference(true)}
                  className="px-0"
                >
                  + Adicionar novo psicólogo (referência)
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Nome do psicólogo"
                  value={newReferenceName}
                  onChange={(e) => setNewReferenceName(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateReference}
                  >
                    Criar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewReference(false);
                      setNewReferenceName("");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Registrando..." : "Registrar Consulta"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}

