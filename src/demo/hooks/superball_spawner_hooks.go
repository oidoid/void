package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateSuperballSpawners(
	ents *vvec.Vec[entdata.SuperballSpawnerEnt],
	gam *engine.Engine,
) vgame.Status {
	deltaMs := gam.Frame().DeltaMs
	in := gam.In()
	rnd := gam.Random
	levelBounds := gam.LevelBounds
	balls := &gam.Balls.Vec
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		loop |= vals[i].Update(balls, in, deltaMs, rnd, levelBounds)
	}
	return loop
}
