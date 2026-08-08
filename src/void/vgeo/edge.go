package vgeo

import "github.com/oidoid/void/src/void/vtypes"

type Edge[T vtypes.Number] struct {
	E, N, W, S T
}
