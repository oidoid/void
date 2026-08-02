package levelhooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/demo/hooks"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vhooks"
)

// to-do: collapse with engine init?
func InitInit(gam *engine.Engine) {
	gam.RegisterPreupdate(hooks.UpdateLayers)
	gam.RegisterPreupdate(hooks.UpdateCam)
	anim := gam.Atlas.Anims[int(assets.BackpackerWalkRight)]
	tileW := int32(gam.Level.Tile.W)
	tileH := int32(gam.Level.Tile.H)
	p1s := ventities.NewEntVec(hooks.UpdateP1s, 1)
	p1s.Add(entities.NewP1Ent(
		vgeo.XY[float32]{
			X: float32(gam.Level.Min.X + tileW),
			Y: float32(gam.Level.Min.Y + tileH - int32(anim.Hurtbox.Min.Y)),
		},
		anim,
	))
	gam.RegisterEntUpdate(p1s)

	buttons := ventities.NewEntVec(vhooks.UpdateButtons[*engine.Engine], 4)

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
	gam.RegisterEntUpdate(buttons)

	// to-do: collapse with buttons^?
	superballButtons := ventities.NewEntVec(hooks.UpdateSuperballButtons, 4)
	hitBtn := entities.NewHitSuperballButtonEnt()
	hitBtn.Anchor.Ref = fullscreenToggle
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
	gam.RegisterEntUpdate(superballButtons)

	camStatuses := ventities.NewEntVec(hooks.UpdateCamStatuses, 1)
	camStatus := entities.NewCamStatusEnt(assets.ColorBlue, gfx.ZUIWidget)
	camStatus.Anchor = ventities.AnchorEnt{
		Dir:    vgeo.DirW,
		Margin: vgeo.NewXY[float32](4, 0),
		Ref:    zeroBtn,
	}
	camStatuses.Add(camStatus)
	gam.RegisterEntUpdate(camStatuses)

	drawStatuses := ventities.NewEntVec(hooks.UpdateDrawStatuses)
	drawStatuses.Add(entities.NewDrawStatusEnt(
		assets.ColorBlue,
		vgeo.DirSE,
		vgeo.Edge[int16]{N: 4, E: 4, S: 4, W: 4},
	))
	gam.RegisterEntUpdate(drawStatuses)

	clocks := ventities.NewEntVec(hooks.UpdateClocks, 1)
	clocks.Add(entities.NewClockEnt())
	gam.RegisterEntUpdate(clocks)

	entStatuses := ventities.NewEntVec(hooks.UpdateEntStatuses)
	entStatuses.Add(entities.NewEntStatusEnt())
	gam.RegisterEntUpdate(entStatuses)

	mouseStatuses := ventities.NewEntVec(hooks.UpdateMouseStatuses)
	mouseStatuses.Add(entities.NewMouseStatusEnt())
	gam.RegisterEntUpdate(mouseStatuses)

	cursor := ventities.NewCursorEnt(assets.CursorPointer, 0, 0, gfx.ZCursor)
	cursors := ventities.NewEntVec(hooks.UpdateCursors)
	cursors.Add(cursor)

	levelClips := ventities.NewEntVec(hooks.UpdateLevelClipNinePatches)
	levelClips.Add(newEdgeEnt(gfx.ZUILevelEdge, 1, 1))
	gam.RegisterEntUpdate(levelClips)

	clipFills := ventities.NewEntVec(hooks.UpdateClipFillNinePatches)
	clipFills.Add(newCornerEdgeEnt(gfx.ZViewportEdge))
	clipFills.Add(newFillEnt(gfx.ZGrid))
	gam.RegisterEntUpdate(clipFills)

	gam.RegisterEntUpdate(cursors)
}

func UpdateInit(gam *engine.Engine) vgame.Status {
	return gam.Ents().Update(gam)
}

func newEdgeEnt(z vgfx.Z, w, h uint16) ventities.NinePatchEnt {
	var patches [9]vgfx.Spr
	for i := range patches {
		patches[i].SetAnim(assets.ColorBlack)
	}
	patches[vgeo.DirCenter] = vgfx.Spr{}
	ent := ventities.NinePatchEnt{
		PatchByDir: patches, CornerWH: vgeo.WH[uint16]{W: w, H: h},
	}
	ent.SetZ(z)
	return ent
}

func newCornerEdgeEnt(z vgfx.Z) ventities.NinePatchEnt {
	const cornerTopLeftWH = 16
	ent := newEdgeEnt(z, cornerTopLeftWH, cornerTopLeftWH)
	ent.PatchByDir[vgeo.DirN].SetAnim(assets.ViewportEdgeN)
	ent.PatchByDir[vgeo.DirNE].SetAnim(assets.ViewportEdgeNW)
	ent.PatchByDir[vgeo.DirNE].SetFlipX(true)
	ent.PatchByDir[vgeo.DirE].SetAnim(assets.ViewportEdgeW)
	ent.PatchByDir[vgeo.DirE].SetFlipX(true)
	ent.PatchByDir[vgeo.DirSE].SetAnim(assets.ViewportEdgeNW)
	ent.PatchByDir[vgeo.DirSE].SetFlipX(true)
	ent.PatchByDir[vgeo.DirSE].SetFlipY(true)
	ent.PatchByDir[vgeo.DirS].SetAnim(assets.ViewportEdgeN)
	ent.PatchByDir[vgeo.DirS].SetFlipY(true)
	ent.PatchByDir[vgeo.DirSW].SetAnim(assets.ViewportEdgeNW)
	ent.PatchByDir[vgeo.DirSW].SetFlipY(true)
	ent.PatchByDir[vgeo.DirW].SetAnim(assets.ViewportEdgeW)
	ent.PatchByDir[vgeo.DirNW].SetAnim(assets.ViewportEdgeNW)
	return ent
}

func newFillEnt(z vgfx.Z) ventities.NinePatchEnt {
	var patches [9]vgfx.Spr
	patches[vgeo.DirCenter].SetAnim(assets.GridCell)
	ent := ventities.NinePatchEnt{PatchByDir: patches}
	ent.SetZ(z)
	return ent
}
