package hooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateSuperballButtons(
	vec *vvec.Vec[entities.SuperballButtonEnt],
	gam *engine.Engine,
) vgame.Status {
	layer := gam.Layer(gfx.LayerUI)
	in := gam.In()
	font := gam.Font()
	cam := *gam.Cam()
	deltaMs := gam.DeltaMs()
	rnd := gam.Random
	ballRadius := float32(gam.Atlas.Anims[int(assets.SuperballDefault)].W) / 2
	ents := vec.Vals()
	loop := vgame.Pause
	for i := range ents {
		loop |= ents[i].Update(
			&layer.Sprites,
			in,
			font,
			layer,
			&gam.Balls.Vec,
			cam,
			deltaMs,
			rnd,
			ballRadius,
		)
	}
	return loop
}
