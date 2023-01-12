export * from './src/audio/Synth.ts';
export * from './src/ecs/component-set.ts';
export * from './src/ecs/components/cam.ts';
export * from './src/ecs/components/cursor-film-set.ts';
export * from './src/ecs/components/follow-cam-config.ts';
export * from './src/ecs/components/pickable-config.ts';
export * from './src/ecs/ecs-update.ts';
export * from './src/ecs/ecs.ts';
export * from './src/ecs/ent.ts';
export * from './src/ecs/systems/cam-system.ts';
export * from './src/ecs/systems/cursor-system.ts';
export * from './src/ecs/systems/follow-cam-system.ts';
export * from './src/ecs/systems/follow-point-system.ts';
export * from './src/ecs/systems/render-system.ts';
export * from './src/ecs/systems/system.ts';
export * from './src/input/button.ts';
export * from './src/input/gamepad/gamepad-map.ts';
export * from './src/input/gamepad/gamepad-poller.ts';
export * from './src/input/input-poller.ts';
export * from './src/input/input.ts';
export * from './src/input/keyboard/keyboard-map.ts';
export * from './src/input/keyboard/keyboard-poller.ts';
export * from './src/input/pointer/pointer-map.ts';
export * from './src/input/pointer/pointer-poller.ts';
export * from './src/input/pointer/pointer-type.ts';
export * from './src/level/film-lut.ts';
export * from './src/level/level-parser.ts';
export * from './src/loaders/image-loader.ts';
export * from './src/loaders/json-loader.ts';
export * from './src/renderer/gl.ts';
export * from './src/renderer/renderer-state-machine.ts';
export * from './src/renderer/renderer.ts';
export * from './src/renderer/viewport.ts';
export * from './src/shaders/instance-buffer.ts';
export * from './src/shaders/shader-layout-config.ts';
export * from './src/shaders/shader-layout-parser.ts';
export * from './src/shaders/shader-layout.ts';
export * from './src/sprite/layer.ts';
export * from './src/sprite/sprite.ts';
export * from './src/storage/json-storage.ts';
export * from './src/text/font-parser.ts';
export * from './src/text/font.ts';
export * from './src/text/text-layout.ts';
import gamepadMapJSON from './src/input/gamepad/gamepad-map.json' assert {
  type: 'json',
};
import { GamepadMap } from './src/input/gamepad/gamepad-map.ts';
import keyboardMapJSON from './src/input/keyboard/keyboard-map.json' assert {
  type: 'json',
};
import { KeyboardMap } from './src/input/keyboard/keyboard-map.ts';
import pointerMapJSON from './src/input/pointer/pointer-map.json' assert {
  type: 'json',
};
import { PointerMap } from './src/input/pointer/pointer-map.ts';
import fragment from './src/shaders/fragment.glsl.ts';
import shaderLayoutConfigJSON from './src/shaders/shader-layout-config.json' assert {
  type: 'json',
};
import vertex from './src/shaders/vertex.glsl.ts';

export const gamepadMap = gamepadMapJSON as GamepadMap;
export const pointerMap = pointerMapJSON as PointerMap;
export const keyboardMap = keyboardMapJSON as KeyboardMap;
export const fragmentGLSL: string = fragment;
export const shaderLayoutConfig = shaderLayoutConfigJSON;
export const vertexGLSL: string = vertex;
