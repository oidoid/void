package game

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/demo/hooks"
	"github.com/oidoid/void/src/demo/levels/levelhooks"
	"github.com/oidoid/void/src/void/vhooks"
)

func New() *engine.Engine {
	this := engine.New(vhooks.NewEntVec(hooks.UpdateSuperballs))
	this.Router.Update = levelhooks.UpdateInit

	this.RegisterEntUpdate(&this.Balls)
	this.RegisterEntUpdate(vhooks.NewEntVec(vhooks.UpdateButtons[*engine.Engine]))
	spawner := vhooks.NewEntVec(hooks.UpdateSuperballSpawner)
	spawner.Add(entdata.SuperballSpawnerEnt{})
	this.RegisterEntUpdate(spawner)
	this.RegisterUpdate(hooks.UpdateCam)
	this.RegisterUpdate(vhooks.DebugInput[*engine.Engine])

	return this
}
