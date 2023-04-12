export interface ShaderLayoutConfig {
  readonly uniforms: Readonly<Record<string, string>>
  readonly perVertex: readonly ShaderLayoutConfigAttribute[]
  readonly perInstance: readonly ShaderLayoutConfigAttribute[]
}

export interface ShaderLayoutConfigAttribute {
  readonly type: GLDataType | string
  readonly name: string
  readonly len: number
}
