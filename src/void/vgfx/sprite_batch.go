package vgfx

import (
	"github.com/oidoid/void/src/void/vmath"
)

// holds a local copy of the sprite slice header and viewport so `Draw()` never
// touches the engine heap in a hot loop.
type SpriteBatch struct {
	Sprites  []Sprite
	Viewport vmath.Box[float32]
}

// to-do: find a way to DRY this up. it doesn't seem to inline when more than
//        one call site.
//go:inline
// func (this *SpriteBatch) Draw(sprite Sprite) {
//  // always do a cheap point check instead of a box check.
// 	if !this.Viewport.HitsXY(sprite.XY) {
// 		return
// 	}
// 	n := len(this.Sprites)
// 	this.Sprites = this.Sprites[:n+1]
// 	this.Sprites[n] = sprite
// }
