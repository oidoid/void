package hooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateSuperballSpawners(
	ents *vvec.Vec[entities.SuperballSpawnerEnt],
	gam *engine.Engine,
) vgame.Status {
	deltaMs := gam.Frame().DeltaMs
	in := gam.In()
	rnd := gam.Random
	levelBounds := gam.LevelBounds
	balls := &gam.Balls.Vec
	radius := float32(gam.Atlas.Anims[int(assets.SuperballDefault)].W) / 2
	var spawnXY *vgeo.XY[float32]
	if phy := in.Ptr.Phy(); phy != nil {
		xy := gam.Layer(gfx.LayerTiles).PhyToLayer(phy.Min)
		xy.X -= radius
		xy.Y -= radius
		spawnXY = &xy
	}
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		loop |= vals[i].Update(balls, in, deltaMs, rnd, levelBounds, spawnXY)
	}
	return loop
}
