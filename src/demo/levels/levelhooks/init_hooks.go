package levelhooks

import (
	"github.com/oidoid/void/src/demo/boards"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/demo/hooks"
	"github.com/oidoid/void/src/demo/tags"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vhooks"
	"github.com/oidoid/void/src/void/vmath"
)

const cursorKeyVel = float32(100) // px / sec.

// to-do: collapse with engine init?
func InitInit(gam *engine.Engine) {
	gam.SetBoard(&boards.InitBoard)
	gam.RegisterPreupdate(hooks.UpdateCam)
	gam.RegisterPreupdate(hooks.UpdateLayers)
	anim := gam.Atlas.Anims[int(tags.BackpackerWalkRight)]
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
		gam.Register(&p1)
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
		gam.Atlas.Anims[int(tags.CursorPoint)].Hitbox,
		gfx.ZCursor,
	)
	gam.Cursor = cursor
	cursors := ventities.NewEntVec(hooks.UpdateCursors)
	cursors.Add(cursor)
	gam.RegisterUpdate(cursors)

	buttons := ventities.NewEntVec(vhooks.UpdateButtons[*engine.Engine], 6)
	gam.RegisterUpdate(buttons)

	drawBtn := entities.NewDrawToggleButton(gam)
	buttons.Add(drawBtn)
	contextLossBtn := entities.NewContextLossButton(gam)
	contextLossBtn.Anchor.Ref = drawBtn
	buttons.Add(contextLossBtn)
	screenshotBtn := entities.NewScreenshotButton(gam)
	screenshotBtn.Anchor.Ref = contextLossBtn
	buttons.Add(screenshotBtn)
	fullscreenToggle := entities.NewFullscreenToggle(gam)
	fullscreenToggle.Anchor.Ref = screenshotBtn
	buttons.Add(fullscreenToggle)
	wakelockToggle := entities.NewWakelockToggle(gam)
	wakelockToggle.Anchor.Ref = fullscreenToggle
	buttons.Add(wakelockToggle)
	cursorKeyToggle := entities.NewCursorKeyToggle(cursor)
	cursorKeyToggle.Anchor.Ref = wakelockToggle
	buttons.Add(cursorKeyToggle)
	// to-do: collapse with buttons^?
	superballButtons := ventities.NewEntVec(hooks.UpdateSuperballButtons, 5)
	gam.RegisterUpdate(superballButtons)
	beepBtn := entities.NewBeepSuperballButtonEnt()
	beepBtn.Anchor.Ref = cursorKeyToggle
	superballButtons.Add(beepBtn)
	hitBtn := entities.NewHitSuperballButtonEnt()
	hitBtn.Anchor.Ref = beepBtn
	superballButtons.Add(hitBtn)
	addManyBtn := entities.NewAddManySuperballButtonEnt()
	addManyBtn.Anchor.Ref = hitBtn
	superballButtons.Add(addManyBtn)
	addSomeBtn := entities.NewAddSomeSuperballButtonEnt()
	addSomeBtn.Anchor.Ref = addManyBtn
	superballButtons.Add(addSomeBtn)
	zeroBtn := entities.NewZeroSuperballButtonEnt()
	zeroBtn.Anchor.Ref = addSomeBtn
	superballButtons.Add(zeroBtn)

	camStatus := entities.NewCamStatusEnt(tags.ColorBlue, gfx.ZUIWidget)
	camStatus.Anchor = ventities.AnchorEnt{
		Dir:    vgeo.DirW,
		Margin: vgeo.NewXY[float32](4, 0),
		Ref:    zeroBtn,
	}
	gam.Register(&camStatus)

	drawStatus := entities.NewDrawStatusEnt(
		tags.ColorBlue,
		vgeo.DirSE,
		vgeo.Edge[int16]{E: 4, N: 4, W: 4, S: 4},
	)
	gam.Register(&drawStatus)

	clock := entities.NewClockEnt()
	gam.Register(&clock)

	entStatus := entities.NewEntStatusEnt()
	gam.Register(&entStatus)

	mouseStatus := entities.NewMouseStatusEnt()
	gam.Register(&mouseStatus)

	lvlEdges := ventities.NewEntVec(hooks.UpdateLvlEdgeNinePatches)
	lvlEdges.Add(newEdgeEnt(gfx.ZUILevelEdge, 1, 1))
	gam.RegisterUpdate(lvlEdges)

	clipFills := ventities.NewEntVec(hooks.UpdateClipFillNinePatches)
	clipFills.Add(newCornerEdgeEnt(gfx.ZViewportEdge))
	clipFills.Add(newFillEnt(gfx.ZGrid))
	gam.RegisterUpdate(clipFills)

}

func UpdateInit(gam *engine.Engine) vgame.Status {
	return gam.Ents().Update(gam)
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
