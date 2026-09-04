package app

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
	this.Superballs = *ventities.NewEntVec(hooks.UpdateSuperballs)
	this.RegisterUpdate(&this.Superballs)
	this.Texts = *ventities.NewEntVec(vhooks.UpdateTexts[*engine.Engine])
	this.RegisterUpdate(&this.Texts)
	levelhooks.InitInit(this)
	this.Router.Update = levelhooks.UpdateInit
	return this
}
