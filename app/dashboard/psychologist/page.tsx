"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientsList } from "@/components/psychologist/patients-list";
import { PatientSearch } from "@/components/psychologist/patient-search";
import { GuideSearch } from "@/components/psychologist/guide-search";
import { LinkRequests } from "@/components/psychologist/link-requests";

export default function PsychologistDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user?.role !== "PSYCHOLOGIST") {
      router.push("/dashboard/patient");
    } else if (status === "authenticated") {
      setIsLoading(false);
    }
  }, [status, session, router]);

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

  if (session?.user?.role !== "PSYCHOLOGIST") {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard do Psicólogo</h1>
          <p className="text-muted-foreground">Bem-vindo, {session.user.name}</p>
        </div>
      </div>

      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">Meus Pacientes</TabsTrigger>
          <TabsTrigger value="search">Buscar Paciente</TabsTrigger>
          <TabsTrigger value="guide">Buscar Guia</TabsTrigger>
          <TabsTrigger value="links">Solicitações</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <PatientsList />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <PatientSearch />
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <GuideSearch />
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <LinkRequests />
        </TabsContent>
      </Tabs>
    </div>
  );
}

