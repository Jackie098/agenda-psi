"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FacialRegistration } from "@/components/patient/facial-registration";
import { GuidesList } from "@/components/patient/guides-list";
import { PsychologistLinks } from "@/components/patient/psychologist-links";
import { ReferencesManager } from "@/components/patient/references-manager";
import { ActivityTimeline } from "@/components/patient/activity-timeline";
import { AddSessionDialog } from "@/components/patient/add-session-dialog";
import {
  Wallet,
  Camera,
  CalendarPlus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activitiesRefreshTrigger, setActivitiesRefreshTrigger] = useState(0);

  // Ler a aba da URL ou usar 'activities' como padrão
  const currentTab = searchParams.get("tab") || "activities";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (
      status === "authenticated" &&
      session?.user?.role !== "PATIENT"
    ) {
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

  const handleFacialSuccess = () => {
    fetchBalance();
    setActivitiesRefreshTrigger((prev) => prev + 1);
  };

  const handleSessionSuccess = () => {
    fetchBalance();
    setActivitiesRefreshTrigger((prev) => prev + 1);
  };

  const handleTabChange = (value: string) => {
    // Atualizar a URL com o parâmetro tab
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-2" />
        <Skeleton className="h-5 w-48 mb-8" />
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Skeleton className="h-36" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
        <Skeleton className="h-10 w-full max-w-md mb-4" />
        <Skeleton className="h-64" />
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
          <p className="text-muted-foreground">
            Bem-vindo, {session.user.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Card de Saldo - Destaque Principal */}
        <Card className="md:col-span-1 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo de Créditos
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {balance !== null ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-4xl font-bold ${
                      balance < 0 ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {balance}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    {balance === 1 ? "crédito" : "créditos"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {balance >= 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-muted-foreground">
                        Saldo disponível para consultas
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-destructive" />
                      <span className="text-muted-foreground">
                        Saldo negativo (permitido)
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Skeleton className="h-14 w-32" />
            )}
          </CardContent>
        </Card>

        {/* Card de Registrar Facial */}
        <Card className="group hover:shadow-md transition-shadow border-green-500/20 hover:border-green-500/40">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <Camera className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Bater Facial</h3>
                <p className="text-xs text-muted-foreground">
                  Adicione +1 crédito ao seu saldo
                </p>
              </div>
              <div className="w-full">
                <FacialRegistration onSuccess={handleFacialSuccess} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Registrar Consulta */}
        <Card className="group hover:shadow-md transition-shadow border-blue-500/20 hover:border-blue-500/40">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <CalendarPlus className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Registrar Consulta</h3>
                <p className="text-xs text-muted-foreground">
                  Subtrai créditos do saldo
                </p>
              </div>
              <div className="w-full">
                <AddSessionDialog onSuccess={handleSessionSuccess} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="activities">Histórico de Atividades</TabsTrigger>
          <TabsTrigger value="guides">Guias</TabsTrigger>
          <TabsTrigger value="psychologists">Psicólogos</TabsTrigger>
          <TabsTrigger value="references">Referências</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          <ActivityTimeline refreshTrigger={activitiesRefreshTrigger} />
        </TabsContent>

        <TabsContent value="guides" className="space-y-4">
          <GuidesList />
        </TabsContent>

        <TabsContent value="psychologists" className="space-y-4">
          <PsychologistLinks />
        </TabsContent>

        <TabsContent value="references" className="space-y-4">
          <ReferencesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
