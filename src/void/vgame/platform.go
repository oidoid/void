package vgame

type Platform interface {
	BeepPtr() uintptr
	BeepCount() uint32
	PollPtr() uintptr
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
