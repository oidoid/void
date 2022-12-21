import { Aseprite, AtlasMeta } from '@/atlas-pack';
import {
  assertNonNull,
  Color,
  I16,
  I16Box,
  I16XY,
  NonNull,
  U16Box,
} from '@/oidlib';
import {
  fragmentGLSL,
  GL,
  InstanceBuffer,
  ShaderLayout,
  vertexGLSL,
  Viewport,
} from '@/void';

export interface Renderer {
  readonly gl: GL;
  readonly layout: ShaderLayout;
  readonly uniforms: Readonly<Record<string, GLUniformLocation>>;
  readonly attributes: Readonly<Record<string, number>>;
  readonly projection: Float32Array;
  readonly perInstanceBuffer: GLBuffer;
  readonly loseContext: GLLoseContext;
}

const uv: Uint16Array = new Uint16Array(
  Object.freeze([1, 1, 0, 1, 1, 0, 0, 0]),
);
const uvLen: number = uv.length / 2; // dimensions

export function Renderer<FilmID extends Aseprite.Tag>(
  canvas: HTMLCanvasElement,
  atlas: HTMLImageElement,
  layout: ShaderLayout,
  atlasMeta: AtlasMeta<FilmID>,
): Renderer {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    // https://developer.chrome.com/blog/desynchronized
    desynchronized: true,
    preserveDrawingBuffer: true,
  });
  assertNonNull(gl, 'WebGL 2 unsupported.');

  // Avoid initial color flash by matching the background. [palette][theme]
  const [r, g, b, a] = Color.intToFloats(0xe6e6df_ff); // whoops
  gl.clearColor(r, g, b, a);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Allow transparent textures to be layered.
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  //enables the Z-Buffer
  gl.enable(gl.DEPTH_TEST);
  //  lowest Z value is 0 and the highest one is 1
  gl.depthRange(0, 1);
  // defines the Z-order: the highest values are in the background while the lowest ones are in the front.
  gl.depthFunc(gl.LESS);
  //  the value used by glClear() to clear the Z-Buffer. A value of 1.0 is the highest Z value, OpenGL renders all tiles. If we choose 0.0, OpenGL does not draw any tiles.
  gl.clearDepth(1);

  // Disable image colorspace conversions. The default is browser dependent.
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, false);

  const program = GL.loadProgram(gl, vertexGLSL, fragmentGLSL);
  const uniforms = GL.uniformLocations(gl, program);

  gl.uniform1i(GL.uniformLocation(layout, uniforms, 'uAtlas'), 0);
  gl.uniform1i(GL.uniformLocation(layout, uniforms, 'uSourceByCelID'), 1); // should be keyof shader layout
  gl.uniform2ui(
    GL.uniformLocation(layout, uniforms, 'uAtlasSize'),
    atlas.naturalWidth,
    atlas.naturalHeight,
  );

  const attributes = GL.attributeLocations(gl, program);

  const vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);

  const perVertexBuffer = gl.createBuffer();
  for (const attr of layout.perVertex.attributes) {
    GL.initAttribute(
      gl,
      layout.perVertex.stride,
      layout.perVertex.divisor,
      perVertexBuffer,
      NonNull(attributes[attr.name]),
      attr,
    );
  }
  GL.bufferData(gl, perVertexBuffer, uv, gl.STATIC_READ);

  const perInstanceBuffer = gl.createBuffer();
  for (const attr of layout.perInstance.attributes) {
    GL.initAttribute(
      gl,
      layout.perInstance.stride,
      layout.perInstance.divisor,
      perInstanceBuffer,
      NonNull(attributes[attr.name]),
      attr,
    );
  }

  // Leave vertexArray bound.

  GL.loadTexture(gl, gl.TEXTURE0, atlas);

  const dat = new Uint16Array(
    atlasMeta.celBoundsByID.flatMap(
      (
        box,
      ) => [box.start.x, box.start.y, U16Box.width(box), U16Box.height(box)],
    ),
  );

  GL.loadDataTexture(
    gl,
    gl.TEXTURE1,
    gl.RGBA16UI,
    1,
    dat.byteLength / (4 * 2), // 4 shorts per row
    gl.RGBA_INTEGER,
    gl.UNSIGNED_SHORT,
    dat,
  );
  // Leave textures bound.

  return {
    gl,
    layout,
    uniforms,
    attributes,
    projection: new Float32Array(4 * 4),
    perInstanceBuffer,
    loseContext: gl.getExtension('WEBGL_lose_context'),
  };
}

export namespace Renderer {
  /**
   * @arg canvasWH The desired resolution of the canvas in CSS pixels. E.g.,
   *               {w: window.innerWidth, h: window.innerHeight}.
   * @arg scale Positive integer zoom.
   */
  export function render(
    self: Renderer,
    _time: number,
    scale: I16,
    cam: Readonly<I16Box>,
    instanceBuffer: InstanceBuffer,
  ): void {
    resize(self, scale, cam);
    self.gl.clear(self.gl.COLOR_BUFFER_BIT | self.gl.DEPTH_BUFFER_BIT);
    // self.gl.uniform1ui(
    //   GL.uniformLocation(self.layout, self.uniforms, 'time'),
    //   time,
    // );
    const perInstanceBuffer = self.perInstanceBuffer;
    GL.bufferData(
      self.gl,
      perInstanceBuffer,
      instanceBuffer.buffer,
      self.gl.DYNAMIC_READ,
    );
    self.gl.drawArraysInstanced(
      self.gl.TRIANGLE_STRIP,
      0,
      uvLen,
      instanceBuffer.size,
    );
  }

  /** @arg canvasWH The desired resolution of the canvas in CSS pixels. E.g.,
                    {w: window.innerWidth, h: window.innerHeight}.
      @arg scale Positive integer zoom. */
  export function resize(
    self: Renderer,
    scale: I16,
    cam: Readonly<I16Box>,
  ): void {
    // Always <= native. These are level pixels.
    const camWH = I16XY(I16Box.width(cam), I16Box.height(cam)); // to-do: I16Box.toWH() or drop WH.
    // Always >= native. These are physical pixels.
    const nativeCanvasWH = Viewport.nativeCanvasWH(camWH, scale);

    if (
      self.gl.canvas.width != nativeCanvasWH.x ||
      self.gl.canvas.height != nativeCanvasWH.y
    ) {
      self.gl.canvas.width = nativeCanvasWH.x;
      self.gl.canvas.height = nativeCanvasWH.y;

      self.gl.viewport(0, 0, nativeCanvasWH.x, nativeCanvasWH.y);

      console.debug(
        `Canvas resized to ${nativeCanvasWH.x}×${nativeCanvasWH.y} native pixels with ${camWH.x}×${camWH.y} cam (level pixels) at a ${scale}x scale.`,
      );
    }

    // to-do: support OffscreenCanvas.
    if (self.gl.canvas instanceof HTMLCanvasElement) {
      // No constraints. These pixels may be greater than, less than, or equal to
      // native.
      const clientWH = Viewport.clientCanvasWH(window, nativeCanvasWH); // to-do: pass in devicePixelRatio.
      const diffW = Number.parseFloat(self.gl.canvas.style.width.slice(0, -2)) -
        clientWH.x;
      const diffH =
        Number.parseFloat(self.gl.canvas.style.height.slice(0, -2)) -
        clientWH.y;

      if (
        !Number.isFinite(diffW) || Math.abs(diffW) >= .5 ||
        !Number.isFinite(diffH) || Math.abs(diffH) >= .5
      ) {
        // Ignore zoom.
        self.gl.canvas.style.width = `${clientWH.x}px`;
        self.gl.canvas.style.height = `${clientWH.y}px`;
        console.debug(
          `Canvas styled to ${self.gl.canvas.style.width}×${self.gl.canvas.style.height} ` +
            `for ${devicePixelRatio}x pixel ratio.`,
        );
      }
    }

    self.projection.set(project(cam));
    self.gl.uniformMatrix4fv(
      GL.uniformLocation(self.layout, self.uniforms, 'uProjection'),
      false,
      self.projection,
    );
  }

  // to-do: don't recreate array every loop
  function project(cam: Readonly<I16Box>): number[] {
    // Convert the pixels to clipspace by taking them as a fraction of the cam
    // resolution, scaling to 0-2, flipping the y-coordinate so that positive y
    // is downward, and translating to -1 to 1 and again by the camera position.
    const { w, h } = {
      w: 2 / I16Box.width(cam),
      h: 2 / I16Box.height(cam),
    };
    // deno-fmt-ignore
    return [
      w,  0, 0, -1 - cam.start.x * w,
      0, -h, 0,  1 + cam.start.y * h,
      0,  0, 1,                    0,
      0,  0, 0,                    1
    ]
  }
}
