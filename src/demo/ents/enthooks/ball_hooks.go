package enthooks

import (
	"github.com/oidoid/void/src/demo/ents"
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
)

// const maxBallWallHits = 3

func UpdateBalls(gam *game.Game) {
	sprites := gam.Sprites()
	cam := gam.Cam()
	canvas := gam.Canvas()
	r := vgfx.MaxRadius
	// to-do: export viewport from gam.
	viewport := vmath.NewBox(cam.X-r, cam.Y-r, cam.X+float32(canvas.W)+r, cam.Y+float32(canvas.H)+r)
	lvl := gam.LevelBounds
	spr := *sprites
	vals := gam.Balls.Vals()
	for i := range vals {
		ball := &vals[i]
		updateBall(ball, lvl)
		if viewport.HitsXY(ball.Sprite.XY) {
			n := len(spr)
			spr = spr[:n+1]
			spr[n] = ball.Sprite
		}
		// if updateBall(ball, lvl) {
		// 	balls.Free(ball.handle)
		// 	continue
		// }
	}
	*sprites = spr
}

func updateBall(ent *ents.BallEnt, lvl vmath.Box[float32]) bool {
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
