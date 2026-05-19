import { createHash, randomBytes } from 'crypto'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const raw = `ns_live_${randomBytes(32).toString('hex')}`
  const prefix = raw.slice(0, 16)
  const hash = createHash('sha256').update(raw).digest('hex')
  return { key: raw, prefix, hash }
}

export async function authenticateApiKey(
  authHeader: string | null
): Promise<{ companyId: string; keyId: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null

  const key = authHeader.slice(7).trim()
  if (!key.startsWith('ns_live_')) return null

  const hash = createHash('sha256').update(key).digest('hex')
  const supabase = getAdmin()

  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('id, company_id, active, expires_at')
    .eq('key_hash', hash)
    .single()

  if (!apiKey || !apiKey.active) return null
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) return null

  // Atualizar last_used_at em background
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKey.id)

  return { companyId: apiKey.company_id, keyId: apiKey.id }
}

export async function dispatchWebhook(
  companyId: string,
  event: string,
  payload: object
) {
  const supabase = getAdmin()
  const { data: hooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('company_id', companyId)
    .eq('active', true)
    .contains('events', [event])

  if (!hooks?.length) return

  const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() })

  await Promise.allSettled(
    hooks.map(hook => {
      const sig = createHash('sha256').update(hook.secret + body).digest('hex')
      return fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-NovoSign-Signature': sig,
          'X-NovoSign-Event': event,
        },
        body,
      }).catch(err => console.error(`Webhook ${hook.url} falhou:`, err))
    })
  )
}
