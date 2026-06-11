package vhooks

import (
	"strconv"

	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vmem/vvec"
	"github.com/oidoid/void/src/void/vtext"
)

func UpdateCamStatuses[Game vgame.Game](
	ents *vvec.Vec[ventdata.CamStatusEnt],
	gam Game,
) vgame.Status {
	batch := gam.BeginDraw()
	font := gam.Font()
	canvas := *gam.Canvas()
	camX := gam.CamX()
	camY := gam.CamY()
	vals := ents.Vals()
	loop := vgame.Pause
	fullscreen := gam.Fullscreen()
	for i := range vals {
		loop |= updateCamStatus(
			&vals[i], font, canvas, camX, camY, fullscreen, &batch,
		)
	}
	gam.EndDraw(batch)
	return loop
}

// to-do: move functions to singular hooks in ent method?
func updateCamStatus(
	ent *ventdata.CamStatusEnt,
	font *vtext.Font,
	canvas vmath.WH[uint16],
	camX, camY float32,
	fullscreen bool,
	batch *vgfx.SpriteBatch,
) vgame.Status {
	ent.Z = vgfx.LayerTop

	text := "(" + vtext.FmtFloat(camX) + ", " + vtext.FmtFloat(camY) + ") " +
		strconv.Itoa(int(canvas.W)) + "x" + strconv.Itoa(int(canvas.H))
	if fullscreen {
		text += "f"
	}
	// to-do: @<cam scale>.
	setText(&ent.TextEnt, text)

	layoutText(&ent.TextEnt, font)
	// to-do: if invalid / cam.invalid / return value from layoutText().
	ent.XY = hudXY(ent.HUDEnt, ent.Layout.W, ent.Layout.TrimmedH, canvas)

	updateCamStatusBackground(ent, batch)

	return updateText(&ent.TextEnt, font, batch)
}

// to-do: ask for TextEnt? then i must compute height and ask for margin.
func updateCamStatusBackground(
	ent *ventdata.CamStatusEnt, batch *vgfx.SpriteBatch,
) {
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
