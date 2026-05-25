package game

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/demo/hooks"
	"github.com/oidoid/void/src/demo/levels/levelhooks"
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vhooks"
	"github.com/oidoid/void/src/void/vmath"
)

func New() *engine.Engine {
	this := engine.New()
	this.Balls = *ventdata.NewEntVec(hooks.UpdateSuperballs)
	this.Texts = *ventdata.NewEntVec(vhooks.UpdateTexts[*engine.Engine])
	text := ventdata.TextEnt{Text: "an ancient pond / a frog jumps in / the splash of water"}
	text.Layout.Min = vmath.XY[int16]{X: 100, Y: 100}
	this.Texts.Add(text)
	this.Router.Update = levelhooks.UpdateInit

	this.RegisterEntUpdate(&this.Balls)
	this.RegisterEntUpdate(&this.Texts)
	this.RegisterEntUpdate(ventdata.NewEntVec(vhooks.UpdateButtons[*engine.Engine]))
	spawner := ventdata.NewEntVec(hooks.UpdateSuperballSpawner)
	spawner.Add(entdata.SuperballSpawnerEnt{})
	this.RegisterEntUpdate(spawner)
	this.RegisterUpdate(hooks.UpdateCam)
	this.RegisterUpdate(vhooks.DebugInput[*engine.Engine])

	return this
}
