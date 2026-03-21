package game

import V "github.com/oidoid/void/src/engine"

type Game struct {
	v V.Void
}

var _ V.WasmAPI = (*Game)(nil)

func (gam *Game) GetUpdatePointer() uintptr {
	return gam.v.GetUpdatePointer()
}

func (gam *Game) Update() {
	gam.v.Update()
	println("hello from Go demo")
}
