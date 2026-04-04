import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), {
    locale: ptBR,
    addSuffix: true,
  });
}

export function formatTimestamp(date: string | Date): string {
  return format(new Date(date), "HH:mm:ss", { locale: ptBR });
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}
