package app

import (
	"github.com/oidoid/void/src/internal/demo/engine"
	"github.com/oidoid/void/src/internal/demo/hooks"
	"github.com/oidoid/void/src/internal/demo/levels/levelhooks"
	"github.com/oidoid/void/src/void/ventities"
)

func New() *engine.Eng {
	this := engine.New()
	this.Superballs = *ventities.NewEntVec(hooks.UpdateSuperballs)
	this.RegisterUpdate(&this.Superballs)
	levelhooks.InitInit(this)
	this.Router().Update = levelhooks.UpdateInit
	return this
}
