package game

import (
	"github.com/oidoid/void/src/internal/demo/boards"
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/internal/demo/tags"
	"github.com/oidoid/void/src/void/veng"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

func initGame(gam *Game) {
	gam.SetBoard(&boards.InitBoard)
	gam.RegisterPreupdate(UpdateCam)
	gam.RegisterPreupdate(UpdateLayers)
	for _, spawn := range boards.InitTextSpawns {
		if spawn.Hidden {
			continue
		}
		gam.Texts().Add(veng.NewTextEntFromSpawn(spawn))
	}
	for _, spawn := range boards.InitP1Spawns {
		p1 := NewP1EntFromSpawn(spawn, gam.Atlas())
		gam.RegisterUpdate(p1.Update)
	}

	rnd := gam.Random
	for _, spawn := range boards.InitSuperballSpawns {
		_ = gam.Superballs.Add(NewSuperballEntFromSpawn(rnd, spawn))
	}

	cursor := NewCursorEntFromSpawn(boards.InitCursorSpawns[0], gam.Atlas())
	gam.SetCursor(&cursor.CursorEnt)
	gam.RegisterUpdate(cursor.Update)

	buttons := veng.NewEntVec(UpdateButtons, 6)
	gam.RegisterUpdate(buttons.Update)

	drawBtn := NewDrawToggleButton(gam)
	buttons.Add(drawBtn)
	blurToggle := NewDrawOnBlurToggle(gam)
	blurToggle.Anchor.Ref = drawBtn.AnchorBox
	buttons.Add(blurToggle)
	contextLossBtn := NewContextLossButton(gam)
	contextLossBtn.Anchor.Ref = blurToggle.AnchorBox
	buttons.Add(contextLossBtn)
	screenshotBtn := NewScreenshotButton(gam)
	screenshotBtn.Anchor.Ref = contextLossBtn.AnchorBox
	buttons.Add(screenshotBtn)
	fullscreenToggle := NewFullscreenToggle(gam)
	fullscreenToggle.Anchor.Ref = screenshotBtn.AnchorBox
	buttons.Add(fullscreenToggle)
	cursorKeyToggle := NewCursorKeyToggle(&cursor.CursorEnt)
	cursorKeyToggle.Anchor.Ref = fullscreenToggle.AnchorBox
	buttons.Add(cursorKeyToggle)
	beepBtn := NewBeepSuperballButtonEnt()
	beepBtn.Anchor.Ref = cursorKeyToggle.AnchorBox
	gam.RegisterUpdate(beepBtn.Update)
	hitBtn := NewHitSuperballButtonEnt()
	hitBtn.Anchor.Ref = beepBtn.AnchorBox
	gam.RegisterUpdate(hitBtn.Update)
	addManyBtn := NewAddManySuperballButtonEnt()
	addManyBtn.Anchor.Ref = hitBtn.AnchorBox
	gam.RegisterUpdate(addManyBtn.Update)
	addSomeBtn := NewAddSomeSuperballButtonEnt()
	addSomeBtn.Anchor.Ref = addManyBtn.AnchorBox
	gam.RegisterUpdate(addSomeBtn.Update)
	zeroBtn := NewZeroSuperballButtonEnt()
	zeroBtn.Anchor.Ref = addSomeBtn.AnchorBox
	gam.RegisterUpdate(zeroBtn.Update)

	camStatus := NewCamStatusEnt(tags.ColorBlue, gfx.ZUIWidget)
	camStatus.Anchor = veng.AnchorEnt{
		Dir:    vgeo.DirW,
		Margin: vgeo.NewXY[float32](4, 0),
		Ref:    zeroBtn.AnchorBox,
	}
	gam.RegisterUpdate(camStatus.Update)

	drawStatus := NewDrawStatusEnt(
		tags.ColorBlue,
		vgeo.DirSE,
		vgeo.Edge[int16]{E: 4, N: 4, W: 4, S: 4},
	)
	gam.RegisterUpdate(drawStatus.Update)

	clock := NewClockEnt()
	gam.RegisterUpdate(clock.Update)

	entStatus := NewEntStatusEnt()
	gam.RegisterUpdate(entStatus.Update)

	mouseStatus := NewMouseStatusEnt()
	gam.RegisterUpdate(mouseStatus.Update)

	lvlEdges := veng.NewEntVec(UpdateLvlEdgeNinePatches)
	lvlEdges.Add(newEdgeEnt(gfx.ZUILevelEdge, 1, 1))
	gam.RegisterUpdate(lvlEdges.Update)

	clipFills := veng.NewEntVec(UpdateClipFillNinePatches)
	clipFills.Add(newCornerEdgeEnt(gfx.ZViewportEdge))
	clipFills.Add(newFillEnt(gfx.ZGrid))
	gam.RegisterUpdate(clipFills.Update)
}

func newEdgeEnt(z vgfx.Z, w, h uint16) veng.NinePatchEnt {
	var patches [9]vgfx.Spr
	for i := range patches {
		patches[i].SetTag(tags.ColorBlack)
	}
	patches[vgeo.DirCenter] = vgfx.Spr{}
	ent := veng.NinePatchEnt{
		PatchByDir: patches, CornerWH: vgeo.NewWH(w, h),
	}
	ent.SetZ(z)
	return ent
}

func newCornerEdgeEnt(z vgfx.Z) veng.NinePatchEnt {
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

func newFillEnt(z vgfx.Z) veng.NinePatchEnt {
	var patches [9]vgfx.Spr
	patches[vgeo.DirCenter].SetTag(tags.GridCell)
	ent := veng.NinePatchEnt{PatchByDir: patches}
	ent.SetZ(z)
	return ent
}
