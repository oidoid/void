package vgfx

// draw order group, 0-15; greater is closer to the viewer.
type Layer uint8

const LayerCount = 8
const layerShift = 4

func (this Layer) Z(sub Sublayer) Z { return Z(uint8(this)<<layerShift | uint8(sub)) }
