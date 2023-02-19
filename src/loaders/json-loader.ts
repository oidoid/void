import { JSONObject } from '@/ooz'

export namespace JSONLoader {
  export async function load(source: string): Promise<JSONObject> {
    const response = await fetch(source, {
      headers: { 'Content-Type': 'application/json' },
    })
    return response.json()
  }
}
