declare module '*.aseprite.json' {
  const json: import('./aseprite.ts').Aseprite
  export default json
}

declare module '*.aseprite.test.json' {
  const json: import('./aseprite.ts').Aseprite
  export default json
}
