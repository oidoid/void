package vgfx

// draw order; greater is drawn on top.
type Layer uint8

const (
	LayerBottom Layer = 0
	// LayerUI and above are drawn in screen-space (camera offset is zeroed).
	LayerUI  Layer = 1 << 7
	LayerTop Layer = ^Layer(0)
)

func (this Layer) UI() bool { return this >= LayerUI }
