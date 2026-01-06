"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { XCircle } from "lucide-react";

interface Guide {
  id: string;
  number: string;
  totalCredits: number;
  usedCredits: number;
  expirationDate: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
  company: {
    id: string;
    name: string;
  };
}

interface EditGuideDialogProps {
  guide: Guide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditGuideDialog({
  guide,
  open,
  onOpenChange,
  onSuccess,
}: EditGuideDialogProps) {
  const { toast } = useToast();
  const [newExpirationDate, setNewExpirationDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  const handleSave = async () => {
    if (!guide || !newExpirationDate) {
      toast({
        title: "Erro",
        description: "Selecione uma nova data de validade",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/guides/${guide.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expirationDate: newExpirationDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Data de validade atualizada com sucesso",
        });
        onSuccess();
        onOpenChange(false);
        setNewExpirationDate(undefined);
      } else {
        toast({
          title: "Erro ao atualizar guia",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a guia",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseGuide = async () => {
    if (!guide) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/guides/${guide.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "EXPIRED",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Guia encerrada",
          description: "A guia foi encerrada com sucesso",
        });
        onSuccess();
        onOpenChange(false);
        setShowCloseConfirmation(false);
      } else {
        toast({
          title: "Erro ao encerrar guia",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao encerrar a guia",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!guide) return null;

  const remainingCredits = guide.totalCredits - guide.usedCredits;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Guia</DialogTitle>
            <DialogDescription>
              Altere a data de validade ou encerre a guia antecipadamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-sm">
                <strong>Guia:</strong> #{guide.number}
              </div>
              <div className="text-sm">
                <strong>Empresa:</strong> {guide.company.name}
              </div>
              <div className="text-sm">
                <strong>Créditos:</strong> {guide.usedCredits}/{guide.totalCredits} utilizados
              </div>
              <div className="text-sm">
                <strong>Data atual:</strong>{" "}
                {new Date(guide.expirationDate).toLocaleDateString("pt-BR")}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration">Nova Data de Validade</Label>
              <DatePicker
                date={newExpirationDate}
                onDateChange={setNewExpirationDate}
                placeholder="Selecione a nova data"
              />
              <p className="text-xs text-muted-foreground">
                Você pode selecionar qualquer data (inclusive no passado)
              </p>
            </div>

            {guide.status === "ACTIVE" && remainingCredits > 0 && (
              <div className="border-t pt-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowCloseConfirmation(true)}
                  disabled={isSubmitting}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Encerrar Guia Antecipadamente
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {remainingCredits} {remainingCredits === 1 ? "crédito restante" : "créditos restantes"}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting || !newExpirationDate}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCloseConfirmation} onOpenChange={setShowCloseConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao encerrar a guia antecipadamente, os {remainingCredits}{" "}
              {remainingCredits === 1 ? "crédito restante será perdido" : "créditos restantes serão perdidos"}.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseGuide}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Encerrando..." : "Sim, Encerrar Guia"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

