package game

import V "github.com/oidoid/void/src/engine"

type Game struct {
	engine V.Engine
}

func NewGame() Game {
	return Game{engine: V.NewEngine()}
}

var _ V.WasmAPI = (*Game)(nil)

func (this *Game) GetUpdatePointer() uintptr {
	return this.engine.GetUpdatePointer()
}

func (this *Game) GetSpritePointer() uintptr {
	return this.engine.GetSpritePointer()
}

func (this *Game) GetSpriteCount() uint32 {
	return this.engine.GetSpriteCount()
}

func (this *Game) SetCanvasWH(w, h int32) {
	this.engine.SetCanvasWH(w, h)
}

func (this *Game) Update() V.LoopState {
	return this.engine.Update()
}
