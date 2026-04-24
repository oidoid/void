package game

import (
	"github.com/oidoid/void/src/void/vents"
	"github.com/oidoid/void/src/void/vgame"
)

type Game interface {
	vgame.Game
	Balls() *vents.Zoo[Game]
}
