import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">Agenda Psi</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Sistema de Gerenciamento de Consultas Psicológicas com controle de créditos e guias
          </p>
        </div>

        <div className="flex gap-4">
          <Link href="/auth/signin">
            <Button size="lg">Entrar</Button>
          </Link>
          <Link href="/auth/register">
            <Button size="lg" variant="outline">Criar Conta</Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Para Pacientes</CardTitle>
              <CardDescription>Gerencie suas guias e consultas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">✓ Registre faciais e acumule créditos</p>
              <p className="text-sm">✓ Acompanhe seu saldo em tempo real</p>
              <p className="text-sm">✓ Gerencie múltiplas guias</p>
              <p className="text-sm">✓ Histórico completo de consultas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Para Psicólogos</CardTitle>
              <CardDescription>Acompanhe seus pacientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">✓ Busque pacientes por email/WhatsApp</p>
              <p className="text-sm">✓ Consulte guias por número</p>
              <p className="text-sm">✓ Registre consultas realizadas</p>
              <p className="text-sm">✓ Gerencie vínculos com pacientes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

