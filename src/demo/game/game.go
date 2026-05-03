package game

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/ents/enthooks"
	"github.com/oidoid/void/src/demo/levels/levelhooks"
	"github.com/oidoid/void/src/void/vents/venthooks"
)

func New() *engine.Engine {
	this := engine.New()
	this.Router.Update = levelhooks.UpdateInit
	this.RegisterEntUpdate(enthooks.UpdateBalls)
	this.RegisterEntUpdate(venthooks.UpdateButtons[*engine.Engine])
	return this
}
