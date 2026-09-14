package hooks

import (
	"github.com/oidoid/void/src/internal/demo/engine"
	"github.com/oidoid/void/src/internal/demo/entities"
	"github.com/oidoid/void/src/void/vengine"
)

func UpdateP1(ent *entities.P1Ent, gam *engine.Eng) vengine.Status {
	return ent.Update(gam.DeltaSecs(), gam.Board(), gam.Layer(ent.Z.Layer()))
}
