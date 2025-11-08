declare module '*.aseprite.json' {
  import type {Aseprite} from './aseprite.ts'
  const json: Aseprite
  export default json
}
