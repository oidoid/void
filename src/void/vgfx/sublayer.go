package vgfx

// draw order within a layer, 0-15; greater is closer to the viewer.
type Sublayer uint8

const SublayerCount = 16
const SublayerMask Sublayer = 0xf

func (this Z) Sublayer() Sublayer { return Sublayer(this) & SublayerMask }
