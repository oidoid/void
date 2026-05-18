package levelhooks

import (
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/void/vgame"
)

func UpdateInit(gam *engine.Engine) vgame.Status {
	loop := vgame.Pause
	if gam.SpriteCount() > 0 {
		loop = vgame.Loop
	}
	loop |= gam.Ents().Update(gam)
	return loop
}
