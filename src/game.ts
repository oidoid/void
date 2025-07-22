import { drawableBytes, Sprite } from './graphics/sprite.ts'
import { Pool } from './mem/pool.ts'

const pool = new Pool({
  alloc: (pool) => new Sprite(pool.view, 0, atlas, framer),
  allocBytes: drawableBytes,
  maxPages: opts.maxPages,
  pageBlocks: opts.pageSprites
})
