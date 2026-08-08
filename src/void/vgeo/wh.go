package vgeo

import "github.com/oidoid/void/src/void/vtypes"

type WH[T any] struct {
	W, H T
}

//go:inline
func NewWH[T vtypes.Number](w, h T) WH[T] {
	return WH[T]{W: w, H: h}
}
