package enthooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/ents/entdata"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

// const maxBallWallHits = 3

func UpdateSuperballs(ents *vvec.Vec[entdata.BallEnt], gam *engine.Engine) {
	batch := gam.BeginDraw()
	lvl := gam.LevelBounds
	vals := ents.Vals()
	for i := range vals {
		ball := &vals[i]
		updateSuperball(ball, lvl)
		batch.Draw(&ball.Sprite)
		// if updateBall(ball, lvl) {
		// 	balls.Free(ball.handle)
		// 	continue
		// }
	}
	gam.EndDraw(batch)
}

func updateSuperball(ent *entdata.BallEnt, lvl vmath.Box[float32]) bool {
	r := float32(ent.Sprite.Radius)
	ent.Sprite.X += ent.Vel.X
	ent.Sprite.Y += ent.Vel.Y
	if ent.Sprite.X-r < lvl.Min.X {
		ent.Sprite.X = lvl.Min.X + r
		ent.Vel.X = -ent.Vel.X
		// ball.hits++
	} else if ent.Sprite.X+r > lvl.Max.X {
		ent.Sprite.X = lvl.Max.X - r
		ent.Vel.X = -ent.Vel.X
		// ball.hits++
	}
	if ent.Sprite.Y-r < lvl.Min.Y {
		ent.Sprite.Y = lvl.Min.Y + r
		ent.Vel.Y = -ent.Vel.Y
		// ball.hits++
	} else if ent.Sprite.Y+r > lvl.Max.Y {
		ent.Sprite.Y = lvl.Max.Y - r
		ent.Vel.Y = -ent.Vel.Y
		// ball.hits++
	}
	// return ball.hits >= maxBallWallHits
	return false
}
