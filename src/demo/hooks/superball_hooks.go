package hooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateSuperballs(
	ents *vvec.Vec[entdata.BallEnt],
	gam *engine.Engine,
) vgame.Status {
	anim := gam.Atlas.Anims[int(assets.SuperballDefault)]
	radius := float32(anim.W) / 2
	diameter := radius * 2
	layer := gam.Layer(gfx.LayerBg)
	sprites := &layer.Sprites
	clip := layer.Clip
	clip.Min.X -= diameter
	clip.Min.Y -= diameter
	lvl := gam.LevelBounds
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		loop |= vals[i].Update(sprites, clip, lvl, radius)
	}

	if len(*sprites) > 0 {
		loop |= vgame.Loop
	}

	return loop
}
