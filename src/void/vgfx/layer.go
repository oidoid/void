package vgfx

// group and draw order; greater is closer to the viewer.
// upper nibble = layer group (0-9), lower nibble = sublayer (0-0xf).
type Layer uint8

const LayerShift = 4
const SublayerMask Layer = 0xf

const (
	// tiles and background sprites, relative camera.
	LayerBg Layer = iota << LayerShift
	// level sprites, relative camera.
	LayerLevelA
	// level sprites, relative camera.
	LayerLevelB
	// level sprites, relative camera.
	LayerLevelC
	// UI, fixed camera.
	LayerUIA
	// UI, fixed camera.
	LayerUIB
	// UI, cursor, fixed camera.
	LayerUIC
	// post-processing, fixed camera. to-do: no depth buffer.
	LayerOverlayA
	// post-processing, fixed camera. to-do: no depth buffer.
	LayerOverlayB
	// post-processing, fixed camera. to-do: no depth buffer.
	LayerOverlayC
)

const (
	LayerBottom = LayerBg
	// LayerUI and above are drawn in screen-space (camera offset is zeroed).
	LayerUI  = LayerUIA
	LayerTop = LayerOverlayC | SublayerMask
)

// whether layer does not apply the camera offset.
func (this Layer) IsFixed() bool { return this >= LayerUIA }
