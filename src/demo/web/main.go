package main

import (
	"github.com/oidoid/void/src/demo/game"
	V "github.com/oidoid/void/src/engine"
)

var gam game.Game = game.Game{}

func main() {}

//export GetUpdatePointer
func GetUpdatePointer() uintptr {
	return gam.GetUpdatePointer()
}

//export Update
func Update() V.LoopState {
	return gam.Update()
}
