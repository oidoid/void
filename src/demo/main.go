package demo

import (
	"github.com/oidoid/void/src/demo/ents/enthooks"
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/demo/levels/levelhooks"
	"github.com/oidoid/void/src/void/vents/venthooks"
)

var version string

var Gam *game.Game

func NewGame() *game.Game {
	gam := game.New()
	gam.Router.Update = levelhooks.UpdateInit
	gam.RegisterUpdate(enthooks.UpdateBalls)
	gam.RegisterUpdate(venthooks.UpdateButtons[*game.Game])
	return gam
}

func Init() {
	println(version)
	Gam = NewGame()
}
