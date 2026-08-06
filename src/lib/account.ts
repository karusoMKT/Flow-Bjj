import { GraduationCap, Building2, Zap, type LucideIcon } from "lucide-react";

export type AccountType = "student" | "instructor" | "gym";

export const ACCOUNT_TYPES: {
  key: AccountType;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    key: "student",
    title: "Aluno / Competidor",
    description: "Acompanhe seus treinos, suba de nível e compita no ranking.",
    icon: Zap,
  },
  {
    key: "instructor",
    title: "Professor",
    description: "Anuncie seminários, aulas e conecte-se com alunos.",
    icon: GraduationCap,
  },
  {
    key: "gym",
    title: "Academia",
    description: "Publique avisos, crie eventos e gerencie as graduações da sua equipe.",
    icon: Building2,
  },
];

export function accountTypeLabel(type?: AccountType | null) {
  return ACCOUNT_TYPES.find((t) => t.key === type)?.title ?? "Aluno / Competidor";
}

export function canPublishEvents(type?: AccountType | null) {
  return type === "instructor" || type === "gym";
}
