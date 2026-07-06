package vhooks

import (
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateButtons[Game vgame.Game](
	ents *vvec.Vec[ventities.ButtonEnt],
	gam Game,
) vgame.Status {
	return vgame.Pause
}
