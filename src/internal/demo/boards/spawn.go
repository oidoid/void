// codegen by packboards.
package boards

import (
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vgeo"
)

type SuperballSpawn struct {
	vboards.Spawn
	Vel vgeo.XY[float32]
}

type P1Spawn struct {
	vboards.Spawn
	Clockwise bool
}

type CursorSpawn struct {
	vboards.Spawn
	KbdVel int32
}

type TextSpawn = vboards.TextSpawn
