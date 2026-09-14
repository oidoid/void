package hooks

import (
	"github.com/oidoid/void/src/internal/demo/engine"
	"github.com/oidoid/void/src/internal/demo/entities"
	"github.com/oidoid/void/src/internal/demo/gfx"
	"github.com/oidoid/void/src/void/vengine"
)

func UpdateClock(ent *entities.ClockEnt, gam *engine.Eng) vengine.Status {
	stat, millis := ent.Update(
		gam.Font(), gam.Layer(gfx.LayerUI), gam.Time(), gam.UtcMillis(),
	)
	gam.ReqUpdateInMillis(millis)
	return stat
}
