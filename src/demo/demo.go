package main

import "github.com/oidoid/void/src/demo/game"

var gam game.Game = game.Game{}

func main() {}

//export Hello
func Hello() {
	gam.Hello()
}
