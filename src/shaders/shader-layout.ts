export interface ShaderLayout {
  readonly uniforms: Readonly<{ [name: string]: string }>
  readonly perVertex: ShaderLayoutAttributeBuffer
  readonly perInstance: ShaderLayoutAttributeBuffer
}

export interface ShaderLayoutAttributeBuffer {
  readonly len: number
  readonly stride: number
  readonly divisor: number
  readonly attributes: readonly ShaderLayoutAttribute[]
}

export interface ShaderLayoutAttribute {
  readonly type: GLDataType
  readonly name: string
  readonly len: number
  readonly offset: number
}
