package entdata

import (
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

type SuperballSpawnerEnt struct{}

func (this *SuperballSpawnerEnt) Update(
	balls *vvec.Vec[BallEnt],
	in *vinput.In,
	deltaMs float64,
	rnd func() float32,
	levelBounds vgeo.Box[float32],
	radius float32,
) vgame.Status {
	loop := vgame.Pause
	if in.IsOn(vinput.ButtonA) {
		if xy := in.Ptr.XY(); xy != nil {
			spawnX := xy.X - radius
			spawnY := xy.Y - radius
			for range min(3000, int(60_000*(deltaMs/1000))) {
				ball := NewBallEnt(rnd, spawnX, spawnY)
				_ = balls.Add(ball)
			}
			loop = vgame.Loop
		}
	}
	if in.IsOnStart(vinput.ButtonMenu) {
		toSpawn := int(2.5*1024*1024 - float32(balls.Len()))
		loop = vgame.Loop
		if toSpawn <= 0 {
			balls.Clear()
		} else {
			for range toSpawn {
				x := levelBounds.Min.X + rnd()*(levelBounds.W())
				y := levelBounds.Min.Y + rnd()*(levelBounds.H())
				ball := NewBallEnt(rnd, x, y)
				_ = balls.Add(ball)
			}
		}
	}
	return loop
}
