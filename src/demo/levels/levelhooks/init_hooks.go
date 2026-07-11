package levelhooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/demo/hooks"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vhooks"
)

func InitInit(gam *engine.Engine) {
	gam.RegisterPreupdate(hooks.UpdateLayers)
	gam.RegisterPreupdate(hooks.UpdateCam)

	superballButtons := ventities.NewEntVec(hooks.UpdateSuperballButtons)
	superballButtons.Add(entities.NewSuperballButtonEnt())
	gam.RegisterEntUpdate(superballButtons)

	drawStatuses := ventities.NewEntVec(vhooks.UpdateDrawStatuses[*engine.Engine])
	drawStatuses.Add(ventities.NewDrawStatusEnt(
		assets.BackgroundKiwi,
		vgeo.DirSE,
		vgeo.Border[int16]{N: 4, E: 4, S: 4, W: 4},
	))
	gam.RegisterEntUpdate(drawStatuses)

	entStatuses := ventities.NewEntVec(hooks.UpdateEntStatuses)
	entStatuses.Add(entities.NewEntStatusEnt())
	gam.RegisterEntUpdate(entStatuses)

	gam.RegisterEntUpdate(
		ventities.NewEntVec(vhooks.UpdateButtons[*engine.Engine]),
	)

	camStatuses := ventities.NewEntVec(vhooks.UpdateCamStatuses[*engine.Engine])
	camStatuses.Add(ventities.NewCamStatusEnt(assets.BackgroundBubblegum, gfx.ZUIWidget))
	gam.RegisterEntUpdate(camStatuses)

	mouseStatuses := ventities.NewEntVec(hooks.UpdateMouseStatuses)
	mouseStatuses.Add(entities.NewMouseStatusEnt())
	gam.RegisterEntUpdate(mouseStatuses)

	cursor := ventities.NewCursorEnt(assets.CursorPointer, 0, 0, gfx.ZCursor)
	cursors := ventities.NewEntVec(hooks.UpdateCursors)
	cursors.Add(cursor)

	levelClips := ventities.NewEntVec(hooks.UpdateLevelClipNinePatches)
	levelClips.Add(newBorderEnt(gfx.ZUILevelBorder))
	gam.RegisterEntUpdate(levelClips)

	clipFills := ventities.NewEntVec(hooks.UpdateClipFillNinePatches)
	clipFills.Add(newBorderEnt(gfx.ZOutline))
	clipFills.Add(newFillEnt(gfx.ZGrid))
	gam.RegisterEntUpdate(clipFills)

	gam.RegisterEntUpdate(cursors)
}

func UpdateInit(gam *engine.Engine) vgame.Status {
	return gam.Ents().Update(gam)
}

func newBorderEnt(z vgfx.Z) ventities.NinePatchEnt {
	var byDir [9]vatlas.AnimID
	for i := range byDir {
		byDir[i] = assets.BackgroundBlueberry
	}
	byDir[vgeo.DirCenter] = 0
	ent := ventities.NewNinePatchEnt(byDir, vgeo.WH[uint16]{W: 1, H: 1})
	ent.Z = z
	return ent
}

func newFillEnt(z vgfx.Z) ventities.NinePatchEnt {
	var byDir [9]vatlas.AnimID
	byDir[vgeo.DirCenter] = assets.GridCell
	ent := ventities.NewNinePatchEnt(byDir, vgeo.WH[uint16]{})
	ent.Z = z
	return ent
}
