package vents

import (
	"github.com/oidoid/void/src/void/vgame"
)

type Ent[Game vgame.Game] interface {
	Update(Game)
}
