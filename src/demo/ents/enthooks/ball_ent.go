package enthooks

import (
	"github.com/oidoid/void/src/demo/ents/entdata"
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
)

// const maxBallWallHits = 3

func UpdateBalls(gam game.Game) {
	balls := gam.Balls()
	lvl := gam.LevelBounds()
	sprites := gam.Sprites()
	cam := gam.Cam()
	canvas := gam.Canvas()
	r := vgfx.MaxRadius
	// to-do: export viewport from gam.
	viewport := vmath.NewBounds(cam.X-r, cam.Y-r, cam.X+float32(canvas.W)+r, cam.Y+float32(canvas.H)+r)
	for i := 0; i < balls.Len(); {
		ball := &balls.Vals()[i]
		updateBall(ball, lvl)
		if viewport.HitsXY(ball.Sprite.XY) {
			n := len(*sprites)
			*sprites = (*sprites)[:n+1]
			(*sprites)[n] = ball.Sprite
		}
		// if updateBall(ball, &level) {
		// 	balls.Free(ball.handle)
		// 	continue
		// }
		i++
	}
}

func updateBall(ent *entdata.BallEnt, lvl *vmath.Bounds[float32]) bool {
	radius := float32(ent.Sprite.Radius)
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
