"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            Agenda Psi
          </Link>

          {session?.user && (
            <div className="flex items-center gap-4">
              {session.user.role === "PATIENT" ? (
                <Link href="/dashboard/patient">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              ) : (
                <Link href="/dashboard/psychologist">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm">{session.user.name}</span>
                <Badge variant={session.user.role === "PATIENT" ? "default" : "secondary"}>
                  {session.user.role === "PATIENT" ? "Paciente" : "Psicólogo"}
                </Badge>
              </div>
              <Button variant="outline" onClick={() => signOut()}>
                Sair
              </Button>
            </>
          ) : (
            <Link href="/auth/signin">
              <Button>Entrar</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

