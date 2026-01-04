"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FacialRegistration } from "@/components/patient/facial-registration";
import { GuidesList } from "@/components/patient/guides-list";
import { SessionsList } from "@/components/patient/sessions-list";
import { PsychologistLinks } from "@/components/patient/psychologist-links";

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user?.role !== "PATIENT") {
      router.push("/dashboard/psychologist");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchBalance();
    }
  }, [status]);

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/balance");
      const data = await response.json();
      
      if (response.ok) {
        setBalance(data.balance);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o saldo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (session?.user?.role !== "PATIENT") {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard do Paciente</h1>
          <p className="text-muted-foreground">Bem-vindo, {session.user.name}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {balance !== null ? (
                <span className={balance < 0 ? "text-destructive" : "text-primary"}>
                  {balance} {balance === 1 ? "crédito" : "créditos"}
                </span>
              ) : (
                <Skeleton className="h-10 w-24" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {balance !== null && balance < 0 && "Saldo negativo permitido"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrar Facial</CardTitle>
          </CardHeader>
          <CardContent>
            <FacialRegistration onSuccess={fetchBalance} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-sm">
              Conta Ativa
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="guides" className="space-y-4">
        <TabsList>
          <TabsTrigger value="guides">Guias</TabsTrigger>
          <TabsTrigger value="sessions">Consultas</TabsTrigger>
          <TabsTrigger value="psychologists">Psicólogos</TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-4">
          <GuidesList />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <SessionsList />
        </TabsContent>

        <TabsContent value="psychologists" className="space-y-4">
          <PsychologistLinks />
        </TabsContent>
      </Tabs>
    </div>
  );
}

