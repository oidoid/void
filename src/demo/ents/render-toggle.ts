import * as V from '../../engine/index.ts'

export type RenderToggleEnt = V.HookEnt<RenderToggleHook>

export class RenderToggleHook implements V.Hook {
  readonly query = 'button & renderToggle & sprite'

  update(ent: RenderToggleEnt, v: V.Void): void {
    if (!ent.button.started) return

    // to-do: move under Void helper methods and hide zoo? same for other APIs.
    v.renderer.always = V.buttonOn(ent)

    const csv =
      V.findDebugParam(location.href)
        ?.split(',')
        .filter(str => str && str !== 'render=always') ?? []
    if (v.renderer.always) csv.push('render=always')

    const oldURL = new URL(location.href)
    oldURL.searchParams.delete('debug')
    const params = []
    if (oldURL.searchParams.size) params.push(`${oldURL.searchParams}`)
    if (csv.length) params.push(`debug=${csv.join(',')}`)

    const newURL =
      oldURL.origin +
      oldURL.pathname +
      (params.length ? `?${params.join('&')}` : '') +
      oldURL.hash

    history.replaceState(history.state, '', newURL)
  }
}
