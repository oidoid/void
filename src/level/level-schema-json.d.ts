// https://github.com/microsoft/TypeScript/issues/62924
declare module '*.level.jsonc' {
  const json: import('./level-schema.ts').LevelSchema
  export default json
}
