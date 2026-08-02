package vgfx

// layers draw from lo to hi (greater is closer to the viewer). depth is cleared
// before each pass so a higher layer is always in front. each layer has its own
// coordinate system (scale, phy px offset, and clipbox in phy px), and sprs (in
// layer coords). in a depth-enabled layer, sprs are ordered by sublayer and
// then by one of 4096 screen-Y anchor ranks split over the canvas height: spr
// bottom (default) or start (`Spr.ZTop`).
type Layer uint8

const LayerCount = 8
const LayerShift = 4
const LayerMask uint8 = 0x7

func (this Layer) Z(sub Sublayer) Z {
	return Z(uint8(this&Layer(LayerMask))<<LayerShift |
		uint8(sub&SublayerMask))
}
