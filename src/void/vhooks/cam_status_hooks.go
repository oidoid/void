package vhooks

import (
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateCamStatuses[Game vgame.Game](
	ents *vvec.Vec[ventdata.CamStatusEnt],
	gam Game,
) vgame.Status {
	font := gam.Font()
	canvasPhy := *gam.CanvasPhy()
	cam := vgeo.NewXY(gam.CamX(), gam.CamY())
	fullscreen := gam.Fullscreen()
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		layer := gam.Layer(vals[i].Z.Layer())
		sprites := &layer.Sprites
		loop |= vals[i].Update(
			font, sprites, canvasPhy, cam, fullscreen, layer.Clip,
		)
	}
	return loop
}
