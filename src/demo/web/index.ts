import * as V from "@oidoid/void";

const engine = new V.Engine();
await engine.load("demo.wasm");
engine.register();
