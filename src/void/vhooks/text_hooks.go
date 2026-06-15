package vhooks

import (
	"github.com/oidoid/void/src/void/ventdata"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

func UpdateTexts[Game vgame.Game](
	ents *vvec.Vec[ventdata.TextEnt],
	gam Game,
) vgame.Status {
	batch := gam.BeginDraw()
	vals := ents.Vals()
	loop := vgame.Pause
	font := gam.Font()
	for i := range vals {
		loop |= vals[i].Draw(font, &batch)
	}
	gam.EndDraw(batch)
	return loop
}
