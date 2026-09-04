package app

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/hooks"
	"github.com/oidoid/void/src/demo/levels/levelhooks"
	"github.com/oidoid/void/src/void/vhooks"
)

func New() *engine.Engine {
	this := engine.New()
	this.In().MapDefaults()
	this.Superballs = *this.RegisterEntVec(hooks.UpdateSuperballs)
	this.Texts = *this.RegisterEntVec(vhooks.UpdateTexts[*engine.Engine])
	levelhooks.InitInit(this)
	this.Router.Update = levelhooks.UpdateInit
	return this
}
