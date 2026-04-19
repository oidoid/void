package main

import (
	"github.com/oidoid/void/src/demo/game"
	V "github.com/oidoid/void/src/engine" // to-do: rename V?
)

var gam = game.NewGame()

func main() {}

//export GetUpdatePointer
func GetUpdatePointer() uintptr {
	return gam.GetUpdatePointer()
}

//export GetSpritePointer
func GetSpritePointer() uintptr {
	return gam.GetSpritePointer()
}

//export GetSpriteCount
func GetSpriteCount() uint32 {
	return gam.GetSpriteCount()
}

//export Update
func Update() V.LoopState {
	return gam.Update()
}

//export GetTilePointer
func GetTilePointer() uintptr {
	return gam.GetTilePointer()
}

//export GetTileCount
func GetTileCount() uint32 {
	return gam.GetTileCount()
}

//export GetLevelX
func GetLevelX() int32 { return int32(gam.GetLevelX()) }

//export GetLevelY
func GetLevelY() int32 { return int32(gam.GetLevelY()) }

//export GetLevelW
func GetLevelW() int32 { return int32(gam.GetLevelW()) }

//export GetLevelH
func GetLevelH() int32 { return int32(gam.GetLevelH()) }

//export GetLevelTileW
func GetLevelTileW() int32 { return int32(gam.GetLevelTileW()) }

//export GetLevelTileH
func GetLevelTileH() int32 { return int32(gam.GetLevelTileH()) }

//export GetCamX
func GetCamX() float32 { return gam.GetCamX() }

//export GetCamY
func GetCamY() float32 { return gam.GetCamY() }
