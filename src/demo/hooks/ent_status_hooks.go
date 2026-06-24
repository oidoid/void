package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateEntStatuses(
	ents *vvec.Vec[entdata.EntStatusEnt],
	gam *engine.Engine,
) vgame.Status {
	sprites := gam.Sprites()
	font := gam.Font()
	canvas := *gam.Canvas()
	count := gam.Balls.Len()
	spriteCount := gam.SpriteCount()
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		loop |= vals[i].Update(font, sprites, canvas, count, spriteCount)
	}
	return loop
}
