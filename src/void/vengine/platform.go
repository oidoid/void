package vengine

type Platform interface {
	PollPtr() uintptr
	BeepPtr() uintptr
	BeepCount() uint32
	FullscreenReq() int32
	ScreenshotReq() int32
	ContextLossReq() int32
	DrawAlways() int32
	DrawOnBlur() int32
	RenderMode() int32
	UpdateInMillisReq() uint64
	LayerConfigsPtr() uintptr
	Update() Status
	BoardTilesPtr() uintptr
	BoardW() int32
	BoardH() int32
	BoardTileW() uint8
	BoardTileH() uint8
	CamX() float32 // to-do: rename Phy.
	CamY() float32
	AtlasAnimCount() uint32
	AtlasCelsPerAnim() uint32
	AtlasCelsPtr() uintptr
	AtlasCelsCount() uint32
}
