package main

import (
	"github.com/oidoid/void/src/demo/game"
	V "github.com/oidoid/void/src/engine" // to-do: rename V?
)

var gam = game.NewGame()

func main() {}

//export FramePointer
func FramePointer() uintptr {
	return gam.FramePointer()
}

//export SpritePointer
func SpritePointer() uintptr {
	return gam.SpritePointer()
}

//export SpriteCount
func SpriteCount() uint32 {
	return gam.SpriteCount()
}

//export Update
func Update() V.LoopState {
	return gam.Update()
}

//export TilePointer
func TilePointer() uintptr {
	return gam.TilePointer()
}

//export TileCount
func TileCount() uint32 {
	return gam.TileCount()
}

//export LevelX
func LevelX() int32 { return int32(gam.LevelX()) }

//export LevelY
func LevelY() int32 { return int32(gam.LevelY()) }

//export LevelW
func LevelW() int32 { return int32(gam.LevelW()) }

//export LevelH
func LevelH() int32 { return int32(gam.LevelH()) }

//export LevelTileW
func LevelTileW() int32 { return int32(gam.LevelTileW()) }

//export LevelTileH
func LevelTileH() int32 { return int32(gam.LevelTileH()) }

//export CamX
func CamX() float32 { return gam.CamX() }

//export CamY
func CamY() float32 { return gam.CamY() }
