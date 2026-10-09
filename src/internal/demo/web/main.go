package main

import (
	"github.com/oidoid/void/src/internal/demo/game"
	"github.com/oidoid/void/src/void/veng"
)

var gam *game.Game

func main() {
	println("void " + game.Version + " ───oidoid>°──")
	gam = game.NewGame()
}

//export PollPtr
func PollPtr() uintptr { return gam.PollPtr() }

//export OutPtr
func OutPtr() uintptr { return gam.OutPtr() }

//export Update
func Update() veng.Status { return gam.Update() }
