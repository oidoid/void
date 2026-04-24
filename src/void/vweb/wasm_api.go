package vweb

import "github.com/oidoid/void/src/void/vgame"

type WasmAPI interface {
	FramePointer() uintptr
	SpritePointer() uintptr
	SpriteCount() int
	Update() vgame.LoopState
	TilePointer() uintptr
	TileCount() uint32
	LevelX() int16
	LevelY() int16
	LevelW() uint16
	LevelH() uint16
	LevelTileW() uint8
	LevelTileH() uint8
	CamX() float32
	CamY() float32
}
