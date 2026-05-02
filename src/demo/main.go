package demo

import (
	"github.com/oidoid/void/src/demo/ents/enthooks"
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/demo/levels/levelhooks"
	"github.com/oidoid/void/src/void/vents/venthooks"
)

var version string

var Gam *game.Game

func Init() {
	println(version)
	Gam = game.New()
	Gam.Router.Update = levelhooks.UpdateInit
	Gam.RegisterUpdate(enthooks.UpdateBalls)
	Gam.RegisterUpdate(func(gam *game.Game) {
		venthooks.UpdateButtons(gam.Engine)
	})
}
