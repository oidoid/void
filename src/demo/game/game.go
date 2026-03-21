package game

import V "github.com/oidoid/void/src/engine"

type Game struct {
	engine V.Engine
}

var _ V.WasmAPI = (*Game)(nil)

func (this *Game) GetUpdatePointer() uintptr {
	return this.engine.GetUpdatePointer()
}

func (this *Game) Update() V.LoopState {
	return this.engine.Update()
}
