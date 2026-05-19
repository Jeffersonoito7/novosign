export type UserRole = 'owner' | 'admin' | 'member'
export type DocumentStatus = 'draft' | 'pending' | 'completed' | 'cancelled'
export type SignatoryStatus = 'pending' | 'viewed' | 'signed' | 'rejected'
export type NotificationChannel = 'email' | 'whatsapp' | 'sms'
export type AuditEventType =
  | 'document_created'
  | 'document_sent'
  | 'document_viewed'
  | 'code_sent'
  | 'code_verified'
  | 'signed'
  | 'rejected'
  | 'completed'
  | 'cancelled'

export interface Plan {
  id: string
  name: string
  price_monthly: number
  documents_limit: number
  users_limit: number
  features: string[]
  created_at: string
}

export interface Company {
  id: string
  name: string
  cnpj?: string
  email: string
  logo_url?: string
  plan_id?: string
  credits: number
  created_at: string
}

export interface User {
  id: string
  company_id: string
  name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Document {
  id: string
  company_id: string
  title: string
  status: DocumentStatus
  file_path: string
  file_hash: string
  signed_file_path?: string
  signed_file_hash?: string
  created_by?: string
  expires_at?: string
  message?: string
  created_at: string
  signatories?: Signatory[]
}

export interface Signatory {
  id: string
  document_id: string
  name: string
  email: string
  phone?: string
  cpf?: string
  sign_order: number
  status: SignatoryStatus
  token: string
  notification_channel: NotificationChannel
  signed_at?: string
  ip_address?: string
  user_agent?: string
  geolocation?: {
    lat: number
    lng: number
    city?: string
    country?: string
  }
  signature_image_path?: string
  rejection_reason?: string
  created_at: string
}

export interface AuditEvent {
  id: string
  document_id: string
  signatory_id?: string
  event_type: AuditEventType
  ip_address?: string
  user_agent?: string
  geolocation?: object
  metadata?: object
  created_at: string
}

export interface VerificationCode {
  id: string
  signatory_id: string
  code: string
  channel: NotificationChannel
  expires_at: string
  used_at?: string
  attempts: number
  created_at: string
}

export interface DocumentTemplate {
  id: string
  company_id: string
  title: string
  content: string
  variables: string[]
  created_at: string
}
