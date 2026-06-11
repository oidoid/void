package vhooks

import (
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
	"github.com/oidoid/void/src/void/vtext"
)

func UpdateFPSes[Game vgame.Game](
	ents *vvec.Vec[ventdata.FPSEnt],
	gam Game,
) vgame.Status {
	batch := gam.BeginDraw()
	font := gam.Font()
	nowMs := gam.NowMs()
	tick := gam.Tick()
	canvas := *gam.Canvas()
	vals := ents.Vals()
	loop := vgame.Pause
	for i := range vals {
		loop |= updateFPS(&vals[i], font, &batch, nowMs, tick, canvas)
	}
	gam.EndDraw(batch)
	return loop
}

// to-do: can we move the singular methods to ent package and make them methods?
func updateFPS(
	ent *ventdata.FPSEnt,
	font *vtext.Font,
	batch *vgfx.SpriteBatch,
	nowMs float64,
	tick *vgame.Tick,
	canvas vmath.WH[uint16],
) vgame.Status {
	ent.Z = vgfx.LayerTop

	ent.Next.Frames++
	if nowMs-ent.Next.Start >= 1000 {
		ent.PrevFPS = ent.Next.Frames
		ent.Next.Frames = 0
		ent.Next.Start = nowMs
	}
	text := vtext.FmtFloat2(tick.DeltaMs) + "u " +
		vtext.FmtFloat2(tick.DrawMs) + "d " +
		vtext.PadInt(ent.PrevFPS, 3) + "\vfps" // \v forces consistent kerning.
	setText(&ent.TextEnt, text)

	layoutText(&ent.TextEnt, font)
	// to-do: if invalid / cam.invalid / return value from layoutText().
	ent.XY = hudXY(ent.HUDEnt, ent.Layout.W, ent.Layout.TrimmedH, canvas)

	updateFPSBackground(ent, batch)

	return updateText(&ent.TextEnt, font, batch)
}

// to-do: ask for TextEnt? then i must compute height and ask for margin.
func updateFPSBackground(ent *ventdata.FPSEnt, batch *vgfx.SpriteBatch) {
	const margin = int16(1)
	n := len(batch.Sprites)
	batch.Sprites = batch.Sprites[:n+1]
	batch.Sprites[n] = vgfx.Sprite{
		XY:     vmath.NewXY(float32(ent.XY.X-margin), float32(ent.XY.Y-margin)),
		AnimID: ent.BackgroundAnimID,
		Z:      vgfx.LayerTop - 1,
		WH: vmath.WH[uint16]{
			W: uint16(ent.Layout.W + margin*2),
			H: uint16(ent.Layout.TrimmedH + margin*2),
		},
	}
}
