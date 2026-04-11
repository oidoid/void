package main

import (
	"github.com/oidoid/void/src/demo/game"
	V "github.com/oidoid/void/src/engine"
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

//export SetCanvasWH
func SetCanvasWH(w, h int32) {
	gam.SetCanvasWH(w, h)
}

//export Update
func Update() V.LoopState {
	return gam.Update()
}
