package hooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateSuperballs(
	ents *vvec.Vec[entdata.BallEnt],
	gam *engine.Engine,
) vgame.Status {
	anim := gam.Atlas.Anims[int(assets.SuperballDefault)]
	hitbox := anim.Hitbox
	radius := float32(hitbox.Max.X-hitbox.Min.X) / 2
	diameter := radius * 2
	layer := gam.Layer(gfx.LayerSuperballs)
	sprites := &layer.Sprites
	clip := layer.Clip
	clip.Min.X -= diameter
	clip.Min.Y -= diameter
	tileW := float32(gam.LevelTileW())
	tileH := float32(gam.LevelTileH())
	lb := gam.LevelBounds
	lvl := vgeo.NewBox(
		lb.Min.X+tileW, lb.Min.Y+tileH, lb.Max.X-tileW, lb.Max.Y-tileH,
	)
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
