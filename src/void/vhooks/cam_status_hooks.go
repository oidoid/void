package vhooks

import (
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateCamStatuses[Game vgame.Game](
	vec *vvec.Vec[ventities.CamStatusEnt],
	gam Game,
) vgame.Status {
	font := gam.Font()
	canvasPhy := *gam.CanvasPhy()
	cam := vgeo.NewXY(gam.CamX(), gam.CamY())
	fullscreen := gam.Fullscreen()
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		layer := gam.Layer(ents[i].Z.Layer())
		sprites := &layer.Sprites
		loop |= ents[i].Update(
			font, sprites, canvasPhy, cam, fullscreen, layer.Clip,
		)
	}
	return loop
}
