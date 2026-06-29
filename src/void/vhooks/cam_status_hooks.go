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
	font := gam.Font()
	canvasPhy := *gam.CanvasPhy()
	camX := gam.CamX()
	camY := gam.CamY()
	fullscreen := gam.Fullscreen()
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		sprites := gam.Sprites(vals[i].Z.Layer())
		loop |= vals[i].Update(font, sprites, canvasPhy, camX, camY, fullscreen)
	}
	return loop
}
