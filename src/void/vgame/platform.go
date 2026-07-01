package vgame

type Platform interface {
	FramePointer() uintptr
	LayerConfigsPointer() uintptr
	Update() Status
	TilePointer() uintptr
	TileCount() uint32
	LevelX() int32
	LevelY() int32
	LevelW() int32
	LevelH() int32
	LevelTileW() uint8
	LevelTileH() uint8
	CamX() float32 // to-do: rename Phy.
	CamY() float32
	AtlasAnimCount() uint32
	AtlasCelsPerAnim() uint32
	AtlasCelsPointer() uintptr
	AtlasCelsCount() uint32
}
