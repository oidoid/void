package math

import "math/rand/v2"

type Random struct {
	rnd *rand.Rand
}

func NewRandomSeeded(seed1, seed2 uint64) Random {
	return Random{rnd: rand.New(rand.NewPCG(seed1, seed2))}
}

func NewRandom() Random {
	return NewRandomSeeded(rand.Uint64(), rand.Uint64())
}

func (this *Random) Float64() float64 { return this.rnd.Float64() }
