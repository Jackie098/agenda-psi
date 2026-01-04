"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AddGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Company {
  id: string;
  name: string;
}

export function AddGuideDialog({ open, onOpenChange, onSuccess }: AddGuideDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    number: "",
    totalCredits: "4",
    expirationDate: "",
    companyId: "",
  });

  useEffect(() => {
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
      const data = await response.json();
      
      if (response.ok) {
        setCompanies(data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalCredits: parseInt(formData.totalCredits),
          expirationDate: new Date(formData.expirationDate).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao adicionar guia",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Guia adicionada!",
        description: `Guia #${formData.number} cadastrada com sucesso`,
      });

      setFormData({
        number: "",
        totalCredits: "4",
        expirationDate: "",
        companyId: "",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar guia",
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
          <DialogTitle>Adicionar Nova Guia</DialogTitle>
          <DialogDescription>
            Preencha os dados da sua guia para começar a usar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="number">Número da Guia</Label>
            <Input
              id="number"
              placeholder="Ex: 123456"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalCredits">Total de Créditos</Label>
            <Select
              value={formData.totalCredits}
              onValueChange={(value) => setFormData({ ...formData, totalCredits: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 créditos</SelectItem>
                <SelectItem value="8">8 créditos</SelectItem>
                <SelectItem value="12">12 créditos</SelectItem>
                <SelectItem value="16">16 créditos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate">Data de Validade</Label>
            <Input
              id="expirationDate"
              type="date"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyId">Empresa/Convênio</Label>
            <Select
              value={formData.companyId}
              onValueChange={(value) => setFormData({ ...formData, companyId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Adicionando..." : "Adicionar Guia"}
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

