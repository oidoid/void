package vmath

import "math/rand/v2"

type Random interface {
	Float32() float32
}

func NewRandomSeeded(seed1, seed2 uint64) Random {
	return rand.New(rand.NewPCG(seed1, seed2))
}

func NewRandom() Random {
	return NewRandomSeeded(rand.Uint64(), rand.Uint64())
}
