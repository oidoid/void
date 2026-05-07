package game

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/ents/enthooks"
	"github.com/oidoid/void/src/demo/levels/levelhooks"
	"github.com/oidoid/void/src/void/vents"
	"github.com/oidoid/void/src/void/vents/venthooks"
)

func New() *engine.Engine {
	this := engine.New(vents.NewEntVec(2*1024*1024, enthooks.UpdateSuperballs))
	this.Router.Update = levelhooks.UpdateInit

	this.RegisterEntUpdate(&this.Balls)
	this.RegisterEntUpdate(vents.NewEntVec(32, venthooks.UpdateButtons[*engine.Engine]))
	return this
}
