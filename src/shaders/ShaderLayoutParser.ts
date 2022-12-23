import { assert, Immutable, NumUtil } from '@/oidlib';
import { ShaderLayout, ShaderLayoutConfig } from '@/void';

export type DataTypeSize = typeof DataTypeSize[keyof typeof DataTypeSize];
export const DataTypeSize = Immutable(
  {
    BYTE: 1,
    UNSIGNED_BYTE: 1,
    SHORT: 2,
    UNSIGNED_SHORT: 2,
    INT: 4,
    UNSIGNED_INT: 4,
    FLOAT: 4,
  } as const,
) satisfies Record<GLDataType, number>;

export namespace ShaderLayoutParser {
  export const parse = (config: ShaderLayoutConfig): ShaderLayout =>
    Immutable({
      uniforms: config.uniforms,
      perVertex: parseAttributes(0, config.perVertex),
      perInstance: parseAttributes(1, config.perInstance),
    });
}

function parseAttributes(
  divisor: number,
  configs: readonly ShaderLayoutConfig.Attribute[],
): ShaderLayout.AttributeBuffer {
  const attribs = configs.reduce(reduceAttributeVariable, []);
  let maxDataTypeSize = 0;
  for (const attrib of attribs) {
    assert(
      attrib.type in DataTypeSize,
      `Attribute type ${attrib.type} is unsupported.`,
    );
    maxDataTypeSize = Math.max(maxDataTypeSize, DataTypeSize[attrib.type]);
  }
  const lastAttribute = attribs.at(-1);
  const size = lastAttribute == null ? 0 : nextAttributeOffset(lastAttribute);
  return {
    len: attribs.reduce((sum, { len }) => sum + len, 0),
    stride: NumUtil.ceilMultiple(maxDataTypeSize, size),
    divisor,
    attributes: attribs,
  };
}

const reduceAttributeVariable = (
  attributes: readonly ShaderLayout.Attribute[],
  { type, name, len }: ShaderLayoutConfig.Attribute,
  index: number,
): readonly ShaderLayout.Attribute[] => {
  const attribute = attributes[index - 1];
  const offset = attribute == null ? 0 : nextAttributeOffset(attribute);
  return attributes.concat({ type: <GLDataType> type, name, len, offset });
};

const nextAttributeOffset = (attr: ShaderLayout.Attribute): number =>
  attr.offset + DataTypeSize[attr.type] * attr.len;
