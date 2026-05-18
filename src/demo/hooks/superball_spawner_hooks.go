package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vinput"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateSuperballSpawner(ents *vvec.Vec[entdata.SuperballSpawnerEnt], gam *engine.Engine) vgame.Status {
	frame := gam.Frame()
	kbd := &gam.Input().Keyboard
	loop := vgame.Pause
	for i := range ents.Vals() {
		spawner := &ents.Vals()[i]
		for j := range gam.Input().PointersLen {
			pointer := &gam.Input().Pointers[j]
			if pointer.Buttons&1 == 1 {
				for range min(3000, int(60_000*(frame.DeltaMs/1000))) {
					ball := entdata.NewBallEnt(gam.Random, gam.CamX()+pointer.Min.X, gam.CamY()+pointer.Min.Y)
					_ = gam.Balls.Add(ball)
				}
				println(gam.Balls.Len(), "ents", gam.SpriteCount(), "balls", int(pointer.Min.X), int(pointer.Min.Y), int(frame.DeltaMs))
				loop = vgame.Loop
			}
		}
		if kbd.Keys&vinput.KeyMenu != 0 && spawner.PrevKeys&vinput.KeyMenu == 0 {
			toSpawn := 2*1024*1024 - gam.Balls.Len()
			loop = vgame.Loop
			if toSpawn <= 0 {
				gam.Balls.Clear()
			} else {
				for range toSpawn {
					x := gam.LevelBounds.Min.X + gam.Random()*(gam.LevelBounds.W())
					y := gam.LevelBounds.Min.Y + gam.Random()*(gam.LevelBounds.H())
					ball := entdata.NewBallEnt(gam.Random, x, y)
					_ = gam.Balls.Add(ball)
				}
			}
		}
		spawner.PrevKeys = kbd.Keys
	}
	return loop
}
