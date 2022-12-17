import { Immutable, NumUtil } from '@/oidlib';
import { ShaderLayout, ShaderLayoutConfig } from '@/void';

enum DataTypeSize {
  BYTE = 1,
  UNSIGNED_BYTE = 1,
  SHORT = 2,
  UNSIGNED_SHORT = 2,
  INT = 4,
  UNSIGNED_INT = 4,
  FLOAT = 4,
}

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
  const attributes = configs.reduce(reduceAttributeVariable, []);
  const maxDataTypeSize = attributes
    .map(({ type }) => DataTypeSize[type])
    .reduce((max, val) => Math.max(max, val), 0);
  const lastAttribute = attributes.at(-1);
  const size = lastAttribute == null ? 0 : nextAttributeOffset(lastAttribute);
  return {
    len: attributes.reduce((sum, { len }) => sum + len, 0),
    stride: NumUtil.ceilMultiple(maxDataTypeSize, size),
    divisor,
    attributes,
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
