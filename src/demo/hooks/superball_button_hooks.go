package hooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/demo/tags"
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
	cursorPhy := gam.CursorPhy()
	ballsClip := gam.Layer(gfx.LayerSuperballs).Clip
	spawnCenter := vgeo.NewXY(
		(ballsClip.Min.X+ballsClip.Max.X)/2,
		(ballsClip.Min.Y+ballsClip.Max.Y)/2,
	)

	deltaMs := gam.DeltaMs()
	tileW := float32(gam.BoardTileW())
	tileH := float32(gam.BoardTileH())
	board := vgeo.NewBox(
		tileW,
		tileH,
		float32(gam.Board().W)-tileW,
		float32(gam.Board().H)-tileH,
	)

	rnd := gam.Random
	ballRadius := float32(gam.Atlas.Anims[int(tags.SuperballDefault)].W) / 2
	ents := vec.Vals()
	loop := vgame.Pause
	// to-do: lot of places we actually want an XYWH not a min-max Box.
	for i := range ents {
		loop |= ents[i].Update(
			in,
			&layer.Sprs,
			layer,
			font,
			cursorPhy,
			&gam.Superballs.Vec,
			spawnCenter,
			deltaMs,
			board,
			rnd,
			ballRadius,
			&gam.HitSuperballs,
			&gam.BeepSuperballs,
		)
	}
	return loop
}
