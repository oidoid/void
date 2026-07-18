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

func UpdateSuperballButtons(
	vec *vvec.Vec[*entities.SuperballButtonEnt],
	gam *engine.Engine,
) vgame.Status {
	layer := gam.Layer(gfx.LayerUI)
	in := gam.In()
	font := gam.Font()
	ballsClip := gam.Layer(gfx.LayerSuperballs).Clip
	spawnCenter := vgeo.NewXY(
		(ballsClip.Min.X+ballsClip.Max.X)/2,
		(ballsClip.Min.Y+ballsClip.Max.Y)/2,
	)
	deltaMs := gam.DeltaMs()
	tileW := float32(gam.LevelTileW())
	tileH := float32(gam.LevelTileH())
	bounds := gam.LevelBounds
	lvl := vgeo.NewBox(
		bounds.Min.X+tileW,
		bounds.Min.Y+tileH,
		bounds.Max.X-tileW,
		bounds.Max.Y-tileH,
	)
	rnd := gam.Random
	ballRadius := float32(gam.Atlas.Anims[int(assets.SuperballDefault)].W) / 2
	ents := vec.Vals()
	loop := vgame.Pause
	// to-do: lot of places we actually want an XYWH not a min-max Box.
	for i := range ents {
		loop |= ents[i].Update(
			in,
			&layer.Sprites,
			layer,
			font,
			&gam.Balls.Vec,
			spawnCenter,
			deltaMs,
			lvl,
			rnd,
			ballRadius,
			&gam.HitSuperballs,
		)
	}
	return loop
}
