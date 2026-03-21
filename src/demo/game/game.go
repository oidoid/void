package game

import V "github.com/oidoid/void/src/engine"

type Game struct {
	v V.Void
}

var _ V.WASMAPI = (*Game)(nil)

func (gam *Game) Update() {
	gam.v.Update()
	println("hello from Go demo")
}
