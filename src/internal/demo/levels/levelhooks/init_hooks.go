package levelhooks

import (
	"github.com/oidoid/void/src/internal/demo/boards"
	"github.com/oidoid/void/src/internal/demo/engine"
	"github.com/oidoid/void/src/internal/demo/entities"
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/internal/demo/hooks"
	"github.com/oidoid/void/src/internal/demo/tags"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vmath"
)

const cursorKeyVel = float32(100) // px / sec.

// to-do: collapse with engine init?
func InitInit(gam *engine.Eng) {
	gam.SetBoard(&boards.InitBoard)
	gam.RegisterPreupdate(hooks.UpdateCam)
	gam.RegisterPreupdate(hooks.UpdateLayers)
	for _, spawn := range boards.InitTextSpawns {
		if spawn.Hidden {
			continue
		}
		text := ventities.TextEnt{
			Text: spawn.Text,
			XY: vgeo.NewXY(
				int16(vmath.Floor(spawn.XY.X)),
				int16(vmath.Floor(spawn.XY.Y)),
			),
			Z:   spawn.Z,
			Pal: spawn.Pal,
		}
		gam.Texts().Add(text)
	}
	anim := gam.Atlas().Anims[int(tags.BackpackerWalkRight)]
	for _, spawn := range boards.InitP1Spawns {
		p1 := entities.NewP1Ent(spawn.XY, anim)
		p1.Z = spawn.Z
		p1.SetTag(spawn.Tag)
		p1.SetCel(spawn.Cel)
		p1.Hide(spawn.Hidden)
		p1.SetFlipX(spawn.FlipX)
		p1.SetFlipY(spawn.FlipY)
		p1.SetStretch(spawn.Stretch)
		p1.SetPal(spawn.Pal)
		p1.SetZTop(spawn.ZTop)
		p1.WH = vgeo.NewWH(
			uint16(vmath.Ceil(spawn.WH.W)),
			uint16(vmath.Ceil(spawn.WH.H)),
		)
		p1.Clockwise = spawn.Clockwise
		registerEnt(gam, &p1, hooks.UpdateP1)
	}

	rnd := gam.Random
	for _, spawn := range boards.InitSuperballSpawns {
		superball := entities.NewSuperballEnt(rnd, spawn.XY)
		superball.Vel = spawn.Vel
		superball.Rot = spawn.Rot
		_ = gam.Superballs.Add(superball)
	}

	cursor := new(ventities.CursorEnt)
	*cursor = ventities.NewCursorEnt(
		tags.CursorPoint,
		0,
		cursorKeyVel,
		gam.Atlas().Anims[int(tags.CursorPoint)].Hitbox,
		gfx.ZCursor,
	)
	gam.SetCursor(cursor)
	cursors := ventities.NewEntVec(hooks.UpdateCursors)
	cursors.Add(cursor)
	gam.RegisterUpdate(cursors.Update)

	buttons := ventities.NewEntVec(hooks.UpdateButtons, 6)
	gam.RegisterUpdate(buttons.Update)

	drawBtn := hooks.NewDrawToggleButton(gam)
	buttons.Add(drawBtn)
	blurToggle := hooks.NewDrawOnBlurToggle(gam)
	blurToggle.Anchor.Ref = drawBtn.AnchorBox
	buttons.Add(blurToggle)
	contextLossBtn := hooks.NewContextLossButton(gam)
	contextLossBtn.Anchor.Ref = blurToggle.AnchorBox
	buttons.Add(contextLossBtn)
	screenshotBtn := hooks.NewScreenshotButton(gam)
	screenshotBtn.Anchor.Ref = contextLossBtn.AnchorBox
	buttons.Add(screenshotBtn)
	fullscreenToggle := hooks.NewFullscreenToggle(gam)
	fullscreenToggle.Anchor.Ref = screenshotBtn.AnchorBox
	buttons.Add(fullscreenToggle)
	cursorKeyToggle := hooks.NewCursorKeyToggle(cursor)
	cursorKeyToggle.Anchor.Ref = fullscreenToggle.AnchorBox
	buttons.Add(cursorKeyToggle)
	// to-do: collapse with buttons^?
	superballButtons := ventities.NewEntVec(hooks.UpdateSuperballButtons, 5)
	gam.RegisterUpdate(superballButtons.Update)
	beepBtn := entities.NewBeepSuperballButtonEnt()
	beepBtn.Anchor.Ref = cursorKeyToggle.AnchorBox
	superballButtons.Add(beepBtn)
	hitBtn := entities.NewHitSuperballButtonEnt()
	hitBtn.Anchor.Ref = beepBtn.AnchorBox
	superballButtons.Add(hitBtn)
	addManyBtn := entities.NewAddManySuperballButtonEnt()
	addManyBtn.Anchor.Ref = hitBtn.AnchorBox
	superballButtons.Add(addManyBtn)
	addSomeBtn := entities.NewAddSomeSuperballButtonEnt()
	addSomeBtn.Anchor.Ref = addManyBtn.AnchorBox
	superballButtons.Add(addSomeBtn)
	zeroBtn := entities.NewZeroSuperballButtonEnt()
	zeroBtn.Anchor.Ref = addSomeBtn.AnchorBox
	superballButtons.Add(zeroBtn)

	camStatus := entities.NewCamStatusEnt(tags.ColorBlue, gfx.ZUIWidget)
	camStatus.Anchor = ventities.AnchorEnt{
		Dir:    vgeo.DirW,
		Margin: vgeo.NewXY[float32](4, 0),
		Ref:    zeroBtn.AnchorBox,
	}
	registerEnt(gam, &camStatus, hooks.UpdateCamStatus)

	drawStatus := entities.NewDrawStatusEnt(
		tags.ColorBlue,
		vgeo.DirSE,
		vgeo.Edge[int16]{E: 4, N: 4, W: 4, S: 4},
	)
	registerEnt(gam, &drawStatus, hooks.UpdateDrawStatus)

	clock := entities.NewClockEnt()
	registerEnt(gam, &clock, hooks.UpdateClock)

	entStatus := entities.NewEntStatusEnt()
	registerEnt(gam, &entStatus, hooks.UpdateEntStatus)

	mouseStatus := entities.NewMouseStatusEnt()
	registerEnt(gam, &mouseStatus, hooks.UpdateMouseStatus)

	lvlEdges := ventities.NewEntVec(hooks.UpdateLvlEdgeNinePatches)
	lvlEdges.Add(newEdgeEnt(gfx.ZUILevelEdge, 1, 1))
	gam.RegisterUpdate(lvlEdges.Update)

	clipFills := ventities.NewEntVec(hooks.UpdateClipFillNinePatches)
	clipFills.Add(newCornerEdgeEnt(gfx.ZViewportEdge))
	clipFills.Add(newFillEnt(gfx.ZGrid))
	gam.RegisterUpdate(clipFills.Update)

}

func UpdateInit(gam *engine.Eng) vengine.Status {
	return gam.Ents().Update(gam)
}

func registerEnt[Ent any](
	gam *engine.Eng,
	ent *Ent,
	update func(*Ent, *engine.Eng) vengine.Status,
) {
	gam.RegisterUpdate(func(gam *engine.Eng) vengine.Status {
		return update(ent, gam)
	})
}

func newEdgeEnt(z vgfx.Z, w, h uint16) ventities.NinePatchEnt {
	var patches [9]vgfx.Spr
	for i := range patches {
		patches[i].SetTag(tags.ColorBlack)
	}
	patches[vgeo.DirCenter] = vgfx.Spr{}
	ent := ventities.NinePatchEnt{
		PatchByDir: patches, CornerWH: vgeo.NewWH(w, h),
	}
	ent.SetZ(z)
	return ent
}

func newCornerEdgeEnt(z vgfx.Z) ventities.NinePatchEnt {
	const cornerTopLeftWH = 16
	ent := newEdgeEnt(z, cornerTopLeftWH, cornerTopLeftWH)
	ent.PatchByDir[vgeo.DirE].SetTag(tags.ViewportEdgeW)
	ent.PatchByDir[vgeo.DirE].SetFlipX(true)
	ent.PatchByDir[vgeo.DirNE].SetTag(tags.ViewportEdgeNW)
	ent.PatchByDir[vgeo.DirNE].SetFlipX(true)
	ent.PatchByDir[vgeo.DirN].SetTag(tags.ViewportEdgeN)
	ent.PatchByDir[vgeo.DirNW].SetTag(tags.ViewportEdgeNW)
	ent.PatchByDir[vgeo.DirW].SetTag(tags.ViewportEdgeW)
	ent.PatchByDir[vgeo.DirSW].SetTag(tags.ViewportEdgeNW)
	ent.PatchByDir[vgeo.DirSW].SetFlipY(true)
	ent.PatchByDir[vgeo.DirS].SetTag(tags.ViewportEdgeN)
	ent.PatchByDir[vgeo.DirS].SetFlipY(true)
	ent.PatchByDir[vgeo.DirSE].SetTag(tags.ViewportEdgeNW)
	ent.PatchByDir[vgeo.DirSE].SetFlipX(true)
	ent.PatchByDir[vgeo.DirSE].SetFlipY(true)
	return ent
}

func newFillEnt(z vgfx.Z) ventities.NinePatchEnt {
	var patches [9]vgfx.Spr
	patches[vgeo.DirCenter].SetTag(tags.GridCell)
	ent := ventities.NinePatchEnt{PatchByDir: patches}
	ent.SetZ(z)
	return ent
}
