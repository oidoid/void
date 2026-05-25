package hooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

// const maxBallWallHits = 3

func UpdateSuperballs(ents *vvec.Vec[entdata.BallEnt], gam *engine.Engine) vgame.Status {
	anim := gam.Atlas.Anims[int(assets.SuperballDefault)]
	radius := float32(anim.W) / 2
	batch := gam.BeginDraw()
	lvl := gam.LevelBounds
	vals := ents.Vals()
	for i := range vals {
		ball := &vals[i]
		updateSuperball(ball, lvl, radius)
		if batch.Viewport.HitsXY(ball.XY) {
			n := len(batch.Sprites)
			batch.Sprites = batch.Sprites[:n+1]
			batch.Sprites[n] = vgfx.Sprite{
				XY: ball.XY, AnimID: assets.SuperballDefault, Z: ball.Z,
			}
		}
		// if updateBall(ball, lvl) {
		// 	balls.Free(ball.handle)
		// 	continue
		// }
	}
	gam.EndDraw(batch)
	if len(vals) == 0 {
		return vgame.Pause
	}
	return vgame.Loop
}

func updateSuperball(ent *entdata.BallEnt, lvl vmath.Box[float32], radius float32) bool {
	diameter := radius * 2
	ent.X += ent.D.X
	ent.Y += ent.D.Y
	if ent.X < lvl.Min.X {
		ent.X = lvl.Min.X
		ent.D.X = -ent.D.X
		// ball.hits++
	} else if ent.X+diameter > lvl.Max.X {
		ent.X = lvl.Max.X - diameter
		ent.D.X = -ent.D.X
		// ball.hits++
	}
	if ent.Y < lvl.Min.Y {
		ent.Y = lvl.Min.Y
		ent.D.Y = -ent.D.Y
		// ball.hits++
	} else if ent.Y+diameter > lvl.Max.Y {
		ent.Y = lvl.Max.Y - diameter
		ent.D.Y = -ent.D.Y
		// ball.hits++
	}
	// return ball.hits >= maxBallWallHits
	return false
}
