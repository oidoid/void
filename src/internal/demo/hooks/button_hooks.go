package hooks

import (
	"github.com/oidoid/void/src/internal/demo/engine"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vhooks"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateButtons(
	vec *vvec.Vec[*ventities.ButtonEnt],
	gam *engine.Eng,
) vengine.Status {
	return vhooks.UpdateButtons(vec, &gam.Eng)
}
