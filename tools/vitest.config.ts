import {defineConfig, type UserConfig} from 'vitest/config'
const config: UserConfig = defineConfig({test: {reporters: 'dot'}})
export default config
