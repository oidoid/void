package game

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/hooks"
	"github.com/oidoid/void/src/demo/levels/levelhooks"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vhooks"
)

func New() *engine.Engine {
	this := engine.New()
	this.In().MapDefaults()
	this.Balls = *ventities.NewEntVec(hooks.UpdateSuperballs)
	this.RegisterEntUpdate(&this.Balls)
	this.Texts = *ventities.NewEntVec(vhooks.UpdateTexts[*engine.Engine])
	this.RegisterEntUpdate(&this.Texts)
	levelhooks.InitInit(this)
	this.Router.Update = levelhooks.UpdateInit

	return this
}
