import { JSONValue } from '@/ooz'

export async function loadJSON(source: string): Promise<JSONValue> {
  const response = await fetch(source, {
    headers: { 'Content-Type': 'application/json' },
  })
  return response.json()
}
