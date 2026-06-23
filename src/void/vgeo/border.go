package vgeo

import "github.com/oidoid/void/src/void/vtypes"

type Border[T vtypes.Number] struct {
	N, E, S, W T
}
