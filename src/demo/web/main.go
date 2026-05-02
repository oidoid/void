package main

import (
	"github.com/oidoid/void/src/demo"
	"github.com/oidoid/void/src/void/vgame"
)

func main() {
	demo.Init()
}

//export FramePointer
func FramePointer() uintptr {
	return demo.Gam.FramePointer()
}

//export SpritePointer
func SpritePointer() uintptr {
	return demo.Gam.SpritePointer()
}

//export SpriteCount
func SpriteCount() uint32 {
	return uint32(demo.Gam.SpriteCount())
}

//export Update
func Update() vgame.Status {
	return demo.Gam.Update()
}

//export TilePointer
func TilePointer() uintptr {
	return demo.Gam.TilePointer()
}

//export TileCount
func TileCount() uint32 {
	return demo.Gam.TileCount()
}

//export LevelX
func LevelX() int32 { return demo.Gam.LevelX() }

//export LevelY
func LevelY() int32 { return demo.Gam.LevelY() }

//export LevelW
func LevelW() int32 { return demo.Gam.LevelW() }

//export LevelH
func LevelH() int32 { return demo.Gam.LevelH() }

//export LevelTileW
func LevelTileW() int32 { return int32(demo.Gam.LevelTileW()) }

//export LevelTileH
func LevelTileH() int32 { return int32(demo.Gam.LevelTileH()) }

//export CamX
func CamX() float32 { return demo.Gam.CamX() }

//export CamY
func CamY() float32 { return demo.Gam.CamY() }
