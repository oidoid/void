declare module '*.void.json' {
  import type {GameConfig} from './game-config.ts'
  const json: GameConfig
  export default json
}
