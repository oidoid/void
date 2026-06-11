package levelhooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/demo/hooks"
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vhooks"
	"github.com/oidoid/void/src/void/vmath"
)

func InitInit(gam *engine.Engine) {
	text := ventdata.TextEnt{
		Text: "an ancient pond / a frog jumps in / the splash of water",
		XY:   vmath.XY[int16]{X: 100, Y: 100},
	}
	gam.Texts.Add(text)

	gam.RegisterUpdate(hooks.UpdateCam)

	gam.RegisterUpdate(vhooks.DebugInput[*engine.Engine])

	spawners := ventdata.NewEntVec(hooks.UpdateSuperballSpawners)
	spawners.Add(entdata.SuperballSpawnerEnt{})
	gam.RegisterEntUpdate(spawners)

	fpses := ventdata.NewEntVec(vhooks.UpdateFPSes[*engine.Engine])
	fpses.Add(ventdata.NewFPSEnt(assets.BackgroundKiwi))
	gam.RegisterEntUpdate(fpses)

	gam.RegisterEntUpdate(
		ventdata.NewEntVec(vhooks.UpdateButtons[*engine.Engine]),
	)

	camStatuses := ventdata.NewEntVec(vhooks.UpdateCamStatuses[*engine.Engine])
	camStatuses.Add(ventdata.NewCamStatusEnt(assets.BackgroundBubblegum))
	gam.RegisterEntUpdate(camStatuses)
}

func UpdateInit(gam *engine.Engine) vgame.Status {
	loop := vgame.Pause
	if gam.SpriteCount() > 0 {
		loop = vgame.Loop
	}
	loop |= gam.Ents().Update(gam)
	return loop
}
