"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AddGuideDialog } from "./add-guide-dialog";
import { EditGuideDialog } from "./edit-guide-dialog";
import { Pencil, Trash2 } from "lucide-react";
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
  facialRecords: Array<{
    id: string;
    recordedAt: string;
  }>;
}

export function GuidesList() {
  const { toast } = useToast();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [guideToEdit, setGuideToEdit] = useState<Guide | null>(null);
  const [guideToDelete, setGuideToDelete] = useState<Guide | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const response = await fetch("/api/guides");
      const data = await response.json();

      if (response.ok) {
        setGuides(data);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível carregar guias",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar guias",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!guideToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/guides/${guideToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Guia excluída",
          description: "A guia foi excluída com sucesso",
        });
        fetchGuides();
        setGuideToDelete(null);
      } else {
        toast({
          title: "Erro ao excluir guia",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a guia",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Minhas Guias</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          Adicionar Guia
        </Button>
      </div>

      {guides.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma guia cadastrada. Adicione sua primeira guia para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {guides.map((guide) => (
            <Card key={guide.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Guia #{guide.number}</CardTitle>
                    <CardDescription>{guide.company.name}</CardDescription>
                  </div>
                  {getStatusBadge(guide.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Créditos:</span>
                    <span className="font-medium">
                      {guide.usedCredits} / {guide.totalCredits} usados
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Disponíveis:</span>
                    <span className="font-medium text-primary">
                      {guide.totalCredits - guide.usedCredits} créditos
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Validade:</span>
                    <span className="font-medium">
                      {new Date(guide.expirationDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Faciais:</span>
                    <span className="font-medium">{guide.facialRecords.length}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setGuideToEdit(guide)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  {guide.facialRecords.length === 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => setGuideToDelete(guide)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddGuideDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          fetchGuides();
          setShowAddDialog(false);
        }}
      />

      <EditGuideDialog
        guide={guideToEdit}
        open={!!guideToEdit}
        onOpenChange={(open) => !open && setGuideToEdit(null)}
        onSuccess={fetchGuides}
      />

      <AlertDialog open={!!guideToDelete} onOpenChange={(open) => !open && setGuideToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a guia #{guideToDelete?.number}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Sim, Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

