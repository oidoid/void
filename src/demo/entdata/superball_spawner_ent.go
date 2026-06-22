package entdata

import (
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

type SuperballSpawnerEnt struct {
	PrevKeys vinput.Key // to-do: rising edge detection in input.
}

func (this *SuperballSpawnerEnt) Update(
	balls *vvec.Vec[BallEnt],
	input *vinput.InputPoll,
	deltaMs float64,
	rnd func() float32,
	camX, camY float32,
	levelBounds vmath.Box[float32],
) vgame.Status {
	kbd := &input.Keyboard
	loop := vgame.Pause
	for i := range input.PointersLen {
		pointer := &input.Pointers[i]
		if pointer.Buttons&1 == 1 {
			for range min(3000, int(60_000*(deltaMs/1000))) {
				ball := NewBallEnt(rnd, camX+pointer.Min.X, camY+pointer.Min.Y)
				_ = balls.Add(ball)
			}
			loop = vgame.Loop
		}
	}
	if kbd.Keys&vinput.KeyMenu != 0 && this.PrevKeys&vinput.KeyMenu == 0 {
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
	this.PrevKeys = kbd.Keys
	return loop
}
