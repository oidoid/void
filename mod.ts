export * from './src/audio/Synth.ts';
export * from './src/ecs/components/CursorFilmSet.ts';
export * from './src/ecs/components/FollowCamConfig.ts';
export * from './src/ecs/components/PickableConfig.ts';
export * from './src/ecs/ComponentSet.ts';
export * from './src/ecs/ECS.ts';
export * from './src/ecs/ECSUpdate.ts';
export * from './src/ecs/Ent.ts';
export * from './src/ecs/systems/CursorSystem.ts';
export * from './src/ecs/systems/FollowCamSystem.ts';
export * from './src/ecs/systems/FollowPointSystem.ts';
export * from './src/ecs/systems/RenderSystem.ts';
export * from './src/ecs/systems/System.ts';
export * from './src/input/pointer/PointerButton.ts';
export * from './src/input/pointer/PointerInput.ts';
export * from './src/input/pointer/PointerPoller.ts';
export * from './src/input/pointer/PointerState.ts';
export * from './src/input/pointer/PointerType.ts';
// export * from './src/input/button.ts';
// export * from './src/input/gamepad/gamepad-recorder.ts';
// export * from './src/input/input-bit.ts';
// export * from './src/input/input-recorder.ts';
// export * from './src/input/input-router.ts';
// export * from './src/input/input-set.ts';
// export * from './src/input/input-source.ts';
// export * from './src/input/input.ts';
// export * from './src/input/keyboard/keyboard-recorder.ts';
// export * from './src/input/pointer/pick-recorder.ts';
// export * from './src/input/pointer/point-recorder.ts';
// export * from './src/input/pointer/pointer-input.ts';
// export * from './src/input/pointer/pointer-recorder.ts';
export * from './src/level/FilmLUT.ts';
export * from './src/level/LevelParser.ts';
export * from './src/loaders/ImageLoader.ts';
export * from './src/loaders/JSONLoader.ts';
export * from './src/renderer/GL.ts';
export * from './src/renderer/Renderer.ts';
export * from './src/renderer/RendererStateMachine.ts';
export * from './src/renderer/Viewport.ts';
export * from './src/shaders/InstanceBuffer.ts';
export * from './src/shaders/ShaderLayout.ts';
export * from './src/shaders/ShaderLayoutConfig.ts';
export * from './src/shaders/ShaderLayoutParser.ts';
export * from './src/sprite/Layer.ts';
export * from './src/sprite/Sprite.ts';
export * from './src/storage/JSONStorage.ts';
export * from './src/text/Font.ts';
export * from './src/text/FontParser.ts';
export * from './src/text/TextLayout.ts';
// import defaultGamepadMapJSON from './src/input/gamepad/default-gamepad-map.json' assert {
//   type: 'json',
// };
// import defaultKeyboardMapJSON from './src/input/keyboard/default-keyboard-map.json' assert {
//   type: 'json',
// };
import fragment from './src/shaders/fragment.glsl.ts';
import shaderLayoutConfigJSON from './src/shaders/shaderLayoutConfig.json' assert {
  type: 'json',
};
import vertex from './src/shaders/vertex.glsl.ts';

// export const defaultGamepadMap = defaultGamepadMapJSON;
// export const defaultKeyboardMap = defaultKeyboardMapJSON;
export const fragmentGLSL: string = fragment;
export const shaderLayoutConfig = shaderLayoutConfigJSON;
export const vertexGLSL: string = vertex;
