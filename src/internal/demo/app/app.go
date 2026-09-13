package app

import (
	"github.com/oidoid/void/src/internal/demo/engine"
	"github.com/oidoid/void/src/internal/demo/hooks"
	"github.com/oidoid/void/src/internal/demo/levels/levelhooks"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vhooks"
)

func New() *engine.Eng {
	this := engine.New()
	this.ReqFullscreen(vgame.FullscreenReqEnter)
	this.In().MapDefaults()
	this.Superballs = *ventities.NewEntVec(hooks.UpdateSuperballs)
	this.RegisterUpdate(&this.Superballs)
	this.Texts = *ventities.NewEntVec(vhooks.UpdateTexts[*engine.Eng])
	this.RegisterUpdate(&this.Texts)
	levelhooks.InitInit(this)
	this.Router.Update = levelhooks.UpdateInit
	return this
}
