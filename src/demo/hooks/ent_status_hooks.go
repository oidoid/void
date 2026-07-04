package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateEntStatuses(
	ents *vvec.Vec[entdata.EntStatusEnt],
	gam *engine.Engine,
) vgame.Status {
	font := gam.Font()
	canvasPhy := *gam.CanvasPhy()
	count := gam.Balls.Len()
	spriteCount := len(gam.Layer(gfx.LayerBg).Sprites) // to-do: prior frame aggregate count.
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		layer := gam.Layer(vals[i].Z.Layer())
		sprites := &layer.Sprites
		loop |= vals[i].Update(font, sprites, canvasPhy, count, spriteCount, layer.Clip)
	}
	return loop
}
