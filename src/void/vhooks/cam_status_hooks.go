package vhooks

import (
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateCamStatuses[Game vgame.Game](
	ents *vvec.Vec[ventdata.CamStatusEnt],
	gam Game,
) vgame.Status {
	sprites := gam.Sprites()
	font := gam.Font()
	canvas := *gam.Canvas()
	camX := gam.CamX()
	camY := gam.CamY()
	fullscreen := gam.Fullscreen()
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		loop |= vals[i].Update(font, sprites, canvas, camX, camY, fullscreen)
	}
	return loop
}
