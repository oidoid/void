package vhooks

import (
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateButtons[Game vgame.Game](ents *vvec.Vec[ventdata.ButtonEnt], gam Game) vgame.Status {
	// println(gam.CamX())
	return vgame.Pause
}
