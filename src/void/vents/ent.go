package vents

import (
	"github.com/oidoid/void/src/void/vgame"
)

type Ent[Game vgame.Game] interface {
	Update(Game)
}

// // implemented by anything that can update state and draw each frame.
// type Hook interface {
// 	Update(canvas *engine.Canvas, frame engine.Frame)
// }
