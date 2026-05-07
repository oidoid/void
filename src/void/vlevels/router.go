package vlevels

import "github.com/oidoid/void/src/void/vgame"

type Router[Game any] struct {
	Update func(Game) vgame.Status
}
