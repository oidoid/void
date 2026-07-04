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
	text := ventdata.TextEnt{
		Text: "an ancient pond / a frog jumps in / the splash of water",
		XY:   vgeo.XY[int16]{X: 100, Y: 100},
	}
	gam.Texts.Add(text)

	gam.RegisterPreupdate(hooks.UpdateCam)

	spawners := ventdata.NewEntVec(hooks.UpdateSuperballSpawners)
	spawners.Add(entdata.SuperballSpawnerEnt{})
	gam.RegisterEntUpdate(spawners)

	drawStatuses := ventdata.NewEntVec(vhooks.UpdateDrawStatuses[*engine.Engine])
	drawStatuses.Add(ventdata.NewDrawStatusEnt(
		assets.BackgroundKiwi,
		vgeo.DirSE,
		vgeo.Border[int16]{N: 4, E: 4, S: 4, W: 4},
		gfx.LayerUI.Z(0),
	))
	gam.RegisterEntUpdate(drawStatuses)

	entStatuses := ventdata.NewEntVec(hooks.UpdateEntStatuses)
	entStatuses.Add(entdata.NewEntStatusEnt())
	gam.RegisterEntUpdate(entStatuses)

	gam.RegisterEntUpdate(
		ventdata.NewEntVec(vhooks.UpdateButtons[*engine.Engine]),
	)

	camStatuses := ventdata.NewEntVec(vhooks.UpdateCamStatuses[*engine.Engine])
	camStatuses.Add(ventdata.NewCamStatusEnt(assets.BackgroundBubblegum, gfx.LayerUI.Z(0)))
	gam.RegisterEntUpdate(camStatuses)

	mouseStatuses := ventdata.NewEntVec(hooks.UpdateMouseStatuses)
	mouseStatuses.Add(entdata.NewMouseStatusEnt())
	gam.RegisterEntUpdate(mouseStatuses)

	cursors := ventdata.NewEntVec(vhooks.UpdateCursors[*engine.Engine])
	cursors.Add(ventdata.NewCursorEnt(assets.CursorPointer, 0, 0, gfx.LayerCursor.Z(0)))
	gam.RegisterEntUpdate(cursors)

	border := newBlueberryNinePatch(gfx.LayerUI.Z(1))
	gam.RegisterUpdate(func(gam *engine.Engine) vgame.Status {
		layer := gam.Layer(gfx.LayerUI)
		clip := layer.Clip
		border.XY = clip.Min
		border.WH = vgeo.WH[uint16]{W: uint16(clip.W()), H: uint16(clip.H())}
		border.Update(&layer.Sprites)
		return vgame.Pause
	})
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

func UpdateInit(gam *engine.Engine) vgame.Status {
	return gam.Ents().Update(gam)
}
