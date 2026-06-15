package hooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateSuperballs(
	ents *vvec.Vec[entdata.BallEnt],
	gam *engine.Engine,
) vgame.Status {
	anim := gam.Atlas.Anims[int(assets.SuperballDefault)]
	radius := float32(anim.W) / 2
	batch := gam.BeginDraw()
	lvl := gam.LevelBounds
	vals := ents.Vals()
	for i := range vals {
		ball := &vals[i]
		ball.Update(lvl, radius)
		if batch.Viewport.HitsXY(ball.XY) {
			n := len(batch.Sprites)
			batch.Sprites = batch.Sprites[:n+1]
			batch.Sprites[n] = vgfx.Sprite{
				AnimID: assets.SuperballDefault, XY: ball.XY,
			}
		}
	}
	gam.EndDraw(batch)
	if len(vals) == 0 {
		return vgame.Pause
	}
	return vgame.Loop
}
