import { assert, Immutable, NumUtil } from '@/ooz'
import { ShaderLayout, ShaderLayoutConfig } from '@/void'

export type GLDataTypeSize = keyof typeof GLDataTypeSize
export const GLDataTypeSize = Immutable(
  {
    BYTE: 1,
    UNSIGNED_BYTE: 1,
    SHORT: 2,
    UNSIGNED_SHORT: 2,
    INT: 4,
    UNSIGNED_INT: 4,
    FLOAT: 4,
  } as const,
) satisfies Record<GLDataType, number>

export namespace ShaderLayoutParser {
  export function parse(config: ShaderLayoutConfig): ShaderLayout {
    return Immutable({
      uniforms: config.uniforms,
      perVertex: parseAttributes(0, config.perVertex),
      perInstance: parseAttributes(1, config.perInstance),
    })
  }
}

function parseAttributes(
  divisor: number,
  configs: readonly ShaderLayoutConfig.Attribute[],
): ShaderLayout.AttributeBuffer {
  const attribs = configs.reduce(reduceAttribVariable, [])
  const maxDataTypeSize = attribs.reduce(
    (max, attrib) => Math.max(max, GLDataTypeSize[attrib.type]),
    0,
  )
  const lastAttrib = attribs.at(-1)
  const size = lastAttrib == null ? 0 : nextAttribOffset(lastAttrib)
  return {
    len: attribs.reduce((sum, { len }) => sum + len, 0),
    stride: NumUtil.ceilMultiple(maxDataTypeSize, size),
    divisor,
    attributes: attribs,
  }
}

function reduceAttribVariable(
  attribs: readonly ShaderLayout.Attribute[],
  { type, name, len }: ShaderLayoutConfig.Attribute,
  index: number,
): readonly ShaderLayout.Attribute[] {
  const attrib = attribs[index - 1]
  const offset = attrib == null ? 0 : nextAttribOffset(attrib)
  assert(isGLDataType(type), `${type} is not a GLDataType.`)
  return attribs.concat({ type, name, len, offset })
}

function nextAttribOffset(attrib: ShaderLayout.Attribute): number {
  return attrib.offset + GLDataTypeSize[attrib.type] * attrib.len
}

function isGLDataType(type: string): type is GLDataType {
  return type in GLDataTypeSize
}
