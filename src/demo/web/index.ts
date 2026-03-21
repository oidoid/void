import * as V from "@oidoid/void";
const v = new V.Void();
await v.load("demo.wasm");
v.register();
setTimeout(() => v.update(), 1000);