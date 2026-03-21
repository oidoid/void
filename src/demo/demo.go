package main

import (
	"github.com/oidoid/void/src/demo/game"
)

var gam game.Game = game.Game{}

func main() {}

//export GetUpdatePointer
func GetUpdatePointer() uintptr {
	return gam.GetUpdatePointer()
}

//export Update
func Update() {
	gam.Update()
}
