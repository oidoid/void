package vgfx

// to-do: shouold be 0-7. top 3b.
// draw order group, 0-15; greater is closer to the viewer.
// each layer has its own coord system (scale, offset in phy px, clipbox in phy px), own sprites described in layer coords,
type Layer uint8

const LayerCount = 8
const LayerShift = 4

func (this Layer) Z(sub Sublayer) Z {
	return Z(uint8(this)<<LayerShift | uint8(sub))
}
