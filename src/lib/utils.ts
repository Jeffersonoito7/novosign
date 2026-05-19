import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  const masked = user.slice(0, 2) + '***' + user.slice(-1)
  return `${masked}@${domain}`
}

export function maskPhone(phone: string): string {
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) *****-$3')
}

export function documentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    pending: 'Aguardando assinaturas',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  }
  return labels[status] ?? status
}

export function signatoryStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    viewed: 'Visualizado',
    signed: 'Assinado',
    rejected: 'Recusado',
  }
  return labels[status] ?? status
}
