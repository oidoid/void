package vgeo

import "github.com/oidoid/void/src/void/vtypes"

type Edge[T vtypes.Num] struct {
	E, N, W, S T
}
