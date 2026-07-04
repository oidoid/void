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
	spawnXY *vgeo.XY[float32],
) vgame.Status {
	loop := vgame.Pause
	if in.IsOn(vinput.ButtonA) && spawnXY != nil {
		for range min(3000, int(60_000*(deltaMs/1000))) {
			ball := NewBallEnt(rnd, spawnXY.X, spawnXY.Y)
			_ = balls.Add(ball)
		}
		loop = vgame.Loop
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
