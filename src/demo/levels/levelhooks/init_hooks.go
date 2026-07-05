package levelhooks

import (
	"github.com/oidoid/void/src/demo/assets"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entdata"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/demo/hooks"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vhooks"
)

func InitInit(gam *engine.Engine) {
	gam.RegisterPreupdate(hooks.UpdateLayers)
	gam.RegisterPreupdate(hooks.UpdateCam)

	gam.RegisterUpdate(hooks.UpdateCheckerboard)

	spawners := ventdata.NewEntVec(hooks.UpdateSuperballSpawners)
	spawners.Add(entdata.SuperballSpawnerEnt{})
	gam.RegisterEntUpdate(spawners)

	drawStatuses := ventdata.NewEntVec(vhooks.UpdateDrawStatuses[*engine.Engine])
	drawStatuses.Add(ventdata.NewDrawStatusEnt(
		assets.BackgroundKiwi,
		vgeo.DirSE,
		vgeo.Border[int16]{N: 4, E: 4, S: 4, W: 4},
		gfx.ZUIStatus,
	))
	gam.RegisterEntUpdate(drawStatuses)

	entStatuses := ventdata.NewEntVec(hooks.UpdateEntStatuses)
	entStatuses.Add(entdata.NewEntStatusEnt())
	gam.RegisterEntUpdate(entStatuses)

	gam.RegisterEntUpdate(
		ventdata.NewEntVec(vhooks.UpdateButtons[*engine.Engine]),
	)

	camStatuses := ventdata.NewEntVec(vhooks.UpdateCamStatuses[*engine.Engine])
	camStatuses.Add(ventdata.NewCamStatusEnt(assets.BackgroundBubblegum, gfx.ZUIStatus))
	gam.RegisterEntUpdate(camStatuses)

	mouseStatuses := ventdata.NewEntVec(hooks.UpdateMouseStatuses)
	mouseStatuses.Add(entdata.NewMouseStatusEnt())
	gam.RegisterEntUpdate(mouseStatuses)

	cursor := ventdata.NewCursorEnt(assets.CursorPointer, 0, 0, gfx.ZCursor)
	cursors := ventdata.NewEntVec(hooks.UpdateCursors)
	cursors.Add(cursor)

	borders := ventdata.NewEntVec(hooks.UpdateLevelNinePatches)
	borders.Add(newBlueberryNinePatch(gfx.ZLevelBorder))
	gam.RegisterEntUpdate(borders)

	screenEdge := ventdata.NewEntVec(hooks.UpdateClipNinePatches)
	screenEdge.Add(newBlueberryNinePatch(gfx.ZOutline))
	gam.RegisterEntUpdate(screenEdge)

	gam.RegisterEntUpdate(cursors)
}

func UpdateInit(gam *engine.Engine) vgame.Status {
	return gam.Ents().Update(gam)
}

func newBlueberryNinePatch(z vgfx.Z) ventdata.NinePatchEnt {
	var byDir [9]vatlas.AnimID
	for i := range byDir {
		byDir[i] = assets.BackgroundBlueberry
	}
	byDir[vgeo.DirCenter] = 0
	ent := ventdata.NewNinePatchEnt(byDir, vgeo.WH[uint16]{W: 1, H: 1})
	ent.Z = z
	return ent
}
