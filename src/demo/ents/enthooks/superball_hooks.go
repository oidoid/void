package enthooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/ents/entdata"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

// const maxBallWallHits = 3

func UpdateSuperballs(ents *vvec.Vec[entdata.BallEnt], gam *engine.Engine) {
	anim := gam.Atlas.Anims[int(assets.SuperballDefault)]
	radius := float32(anim.W) / 2
	batch := gam.BeginDraw()
	lvl := gam.LevelBounds
	vals := ents.Vals()
	for i := range vals {
		ball := &vals[i]
		updateSuperball(ball, lvl, radius)
		batch.Draw(&ball.Sprite)
		// if updateBall(ball, lvl) {
		// 	balls.Free(ball.handle)
		// 	continue
		// }
	}
	gam.EndDraw(batch)
}

func updateSuperball(ent *entdata.BallEnt, lvl vmath.Box[float32], radius float32) bool {
	ent.Sprite.X += ent.Vel.X
	ent.Sprite.Y += ent.Vel.Y
	if ent.Sprite.X-radius < lvl.Min.X {
		ent.Sprite.X = lvl.Min.X + radius
		ent.Vel.X = -ent.Vel.X
		// ball.hits++
	} else if ent.Sprite.X+radius > lvl.Max.X {
		ent.Sprite.X = lvl.Max.X - radius
		ent.Vel.X = -ent.Vel.X
		// ball.hits++
	}
	if ent.Sprite.Y-radius < lvl.Min.Y {
		ent.Sprite.Y = lvl.Min.Y + radius
		ent.Vel.Y = -ent.Vel.Y
		// ball.hits++
	} else if ent.Sprite.Y+radius > lvl.Max.Y {
		ent.Sprite.Y = lvl.Max.Y - radius
		ent.Vel.Y = -ent.Vel.Y
		// ball.hits++
	}
	// return ball.hits >= maxBallWallHits
	return false
}
