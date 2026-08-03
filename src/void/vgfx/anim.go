package vgfx

import "github.com/oidoid/void/src/void/vatlas"

// returns the Spr cel that starts an animation at cel zero now.
func AnimStartCel(nowMillis float64) uint8 {
	cel := uint8(uint64(nowMillis / vatlas.CelMillis))
	return -cel & uint8(vatlas.AnimCelMask)
}

// reports whether a full animation cycle has elapsed since startMillis.
func IsAnimLooped(anim vatlas.Anim, startMillis, nowMillis float64) bool {
	return animElapsedCels(startMillis, nowMillis) >= uint64(anim.Cels)
}

func animElapsedCels(startMillis, nowMillis float64) uint64 {
	if nowMillis <= startMillis {
		return 0
	}
	return uint64((nowMillis - startMillis) / vatlas.CelMillis)
}
