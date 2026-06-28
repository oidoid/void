package vgfx

// group and draw order; greater is closer to the viewer.
type LayerSub uint8

const LayerShift = 4

const (
	SublayerMask LayerSub = 0x0f

	LayerSubBg       LayerSub = LayerSub(LayerBg << LayerShift)
	LayerSubLevelA   LayerSub = LayerSub(LayerLevelA << LayerShift)
	LayerSubLevelB   LayerSub = LayerSub(LayerLevelB << LayerShift)
	LayerSubLevelC   LayerSub = LayerSub(LayerLevelC << LayerShift)
	LayerSubUIA      LayerSub = LayerSub(LayerUIA << LayerShift)
	LayerSubUIB      LayerSub = LayerSub(LayerUIB << LayerShift)
	LayerSubUIC      LayerSub = LayerSub(LayerUIC << LayerShift)
	LayerSubOverlayA LayerSub = LayerSub(LayerOverlayA << LayerShift)
	LayerSubOverlayB LayerSub = LayerSub(LayerOverlayB << LayerShift)
	LayerSubOverlayC LayerSub = LayerSub(LayerOverlayC << LayerShift)

	LayerSubBottom = LayerSubBg
	// LayerUI and above are drawn in screen-space (camera offset is zeroed).
	LayerSubUI  = LayerSubUIA
	LayerSubTop = LayerSubOverlayC | SublayerMask
)

// reports whether the layer does not apply the camera offset.
func (this LayerSub) IsFixed() bool { return this >= LayerSubUIA }

func (this LayerSub) Group() Layer { return Layer(this >> LayerShift) }

// sprite
// each layer may be scaled independently and camera may be fixed or relative.
type Layer uint8

const (
	// tiles and background sprites, relative camera.
	LayerBg Layer = iota
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

func (this Layer) Layer() LayerSub { return LayerSub(this << LayerShift) }
