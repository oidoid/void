package hooks

import (
	"github.com/oidoid/void/src/internal/demo/engine"
	"github.com/oidoid/void/src/internal/demo/entities"
	"github.com/oidoid/void/src/void/vengine"
)

func UpdateDrawStatus(
	ent *entities.DrawStatusEnt,
	gam *engine.Eng,
) vengine.Status {
	return ent.Update(
		gam.Font(), gam.Layer(ent.Z.Layer()), gam.NowMillis(), gam.Tick(),
	)
}
