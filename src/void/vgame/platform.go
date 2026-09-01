package vgame

type Platform interface {
	BeepPointer() uintptr
	BeepCount() uint32
	FramePointer() uintptr
	LayerConfigsPointer() uintptr
	Update() Status
	BoardTilesPointer() uintptr
	BoardW() int32
	BoardH() int32
	BoardTileW() uint8
	BoardTileH() uint8
	CamX() float32 // to-do: rename Phy.
	CamY() float32
	AtlasAnimCount() uint32
	AtlasCelsPerAnim() uint32
	AtlasCelsPointer() uintptr
	AtlasCelsCount() uint32
}
