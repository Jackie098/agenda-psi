import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requirePatient() {
  const user = await requireRole(UserRole.PATIENT);
  if (!user.patientId) {
    throw new Error("Patient profile not found");
  }
  return { user, patientId: user.patientId };
}

export async function requirePsychologist() {
  const user = await requireRole(UserRole.PSYCHOLOGIST);
  if (!user.psychologistId) {
    throw new Error("Psychologist profile not found");
  }
  return { user, psychologistId: user.psychologistId };
}

