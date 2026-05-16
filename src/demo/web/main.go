package main

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/void/vgame"
)

var gam *engine.Engine

func main() {
	println(engine.Version)
	gam = game.New()
}

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
	return uint32(gam.SpriteCount())
}

//export Update
func Update() vgame.Status {
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
func LevelX() int32 { return gam.LevelX() }

//export LevelY
func LevelY() int32 { return gam.LevelY() }

//export LevelW
func LevelW() int32 { return gam.LevelW() }

//export LevelH
func LevelH() int32 { return gam.LevelH() }

//export LevelTileW
func LevelTileW() int32 { return int32(gam.LevelTileW()) }

//export LevelTileH
func LevelTileH() int32 { return int32(gam.LevelTileH()) }

//export CamX
func CamX() float32 { return gam.CamX() }

//export CamY
func CamY() float32 { return gam.CamY() }

//export AtlasAnimCount
func AtlasAnimCount() uint32 { return gam.AtlasAnimCount() }

//export AtlasCelsPerAnim
func AtlasCelsPerAnim() uint32 { return gam.AtlasCelsPerAnim() }

//export AtlasCelsPointer
func AtlasCelsPointer() uintptr { return gam.AtlasCelsPointer() }

//export AtlasCelsCount
func AtlasCelsCount() uint32 { return gam.AtlasCelsCount() }
