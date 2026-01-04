"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AddSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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

export function AddSessionDialog({ open, onOpenChange, onSuccess }: AddSessionDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [references, setReferences] = useState<Reference[]>([]);
  const [showNewReference, setShowNewReference] = useState(false);
  const [newReferenceName, setNewReferenceName] = useState("");
  const [formData, setFormData] = useState({
    scheduledAt: "",
    duration: "50",
    psychologistReferenceId: "",
  });

  useEffect(() => {
    if (open) {
      fetchReferences();
      // Set default date/time to now
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setFormData((prev) => ({
        ...prev,
        scheduledAt: now.toISOString().slice(0, 16),
      }));
    }
  }, [open]);

  const fetchReferences = async () => {
    try {
      const response = await fetch("/api/references");
      const data = await response.json();
      
      if (response.ok) {
        setReferences(data);
      }
    } catch (error) {
      console.error("Error fetching references:", error);
    }
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
        setReferences([...references, data]);
        setFormData({ ...formData, psychologistReferenceId: data.id });
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
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          duration: formData.duration,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
        }),
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
        psychologistReferenceId: "",
      });

      onSuccess();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Label htmlFor="psychologistReferenceId">Psicólogo</Label>
            {!showNewReference ? (
              <>
                <Select
                  value={formData.psychologistReferenceId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, psychologistReferenceId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o psicólogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {references.map((ref) => (
                      <SelectItem key={ref.id} value={ref.id}>
                        {ref.linkedPsychologist?.user.name || ref.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setShowNewReference(true)}
                  className="px-0"
                >
                  + Adicionar novo psicólogo
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
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

