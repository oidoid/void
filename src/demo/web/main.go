package main

import (
	"github.com/oidoid/void/src/demo/ents/enthooks"
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/demo/levels/levelhooks"
	"github.com/oidoid/void/src/void/vents/venthooks"
	"github.com/oidoid/void/src/void/vgame"
)

var version string

var gam *game.Game

func main() {
	println(version)
	gam = game.New()
	gam.Router.Update = levelhooks.UpdateInit
	gam.RegisterUpdate(enthooks.UpdateBalls)
	gam.RegisterUpdate(func(gam *game.Game) {
		venthooks.UpdateButtons(gam.Engine)
	})
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
