// Only the input digest and UUID live in sessionStorage. No financial fields.
export async function cardCreationRequest(input: unknown): Promise<{ id: string; key: string }> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(input)))
  const key = 'hf-card-request:' + Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2,'0')).join('')
  const previous = sessionStorage.getItem(key)
  const id = previous ?? crypto.randomUUID()
  sessionStorage.setItem(key,id)
  return { id,key }
}
