package game

import V "github.com/oidoid/void/src/engine"

type Game struct {
	v V.Void
}

func (gam *Game) Hello() {
	gam.v.Hello()
	println("hello from Go demo")
}
