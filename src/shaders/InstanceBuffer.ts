import { I16Box, Uint } from '@/oidlib';
import { ShaderLayout, Sprite } from '@/void';

const littleEndian: boolean = new Int8Array(new Int16Array([1]).buffer)[0] == 1;

export interface InstanceBuffer {
  buffer: DataView;
  size: number;
  readonly layout: ShaderLayout;
}

export function InstanceBuffer(
  layout: ShaderLayout,
  len: Uint = Uint(0),
): InstanceBuffer {
  return {
    buffer: new DataView(new ArrayBuffer(layout.perInstance.stride * len)),
    layout,
    size: 0,
  };
}

export namespace InstanceBuffer {
  // to-do: only copy dirty instances. replace removed instances with thel ast element. presrve the buffer on resize.
  export function resize(
    self: InstanceBuffer,
    len: Uint,
  ): void {
    self.buffer = new DataView(
      new ArrayBuffer(self.layout.perInstance.stride * len),
    );
  }

  /** Tightly coupled to ShaderLayout and GLSL. */
  export function set(
    self: InstanceBuffer,
    index: number,
    sprite: Readonly<Sprite>,
    time: number,
  ): void {
    const i = index * self.layout.perInstance.stride;
    if (self.buffer.byteLength < (i + self.layout.perInstance.stride)) {
      resize(self, Uint(Math.max(1, index) * 2));
    }
    self.size = index + 1;
    self.buffer.setUint16(i + 0, sprite.animator.cel(time).id, littleEndian);
    self.buffer.setInt16(i + 2, sprite.bounds.start.x, littleEndian);
    self.buffer.setInt16(i + 4, sprite.bounds.start.y, littleEndian);
    self.buffer.setInt16(i + 6, I16Box.width(sprite.bounds), littleEndian);
    self.buffer.setInt16(i + 8, I16Box.height(sprite.bounds), littleEndian);
    self.buffer.setUint16(i + 10, sprite.wrapSuborderLayer, littleEndian);
    self.buffer.setUint16(i + 12, sprite.moreBits, littleEndian);
  }
}
