package game

import "github.com/oidoid/void/src/void/vgame"

type Game interface {
	vgame.Game
	SuperballCount() int
}
