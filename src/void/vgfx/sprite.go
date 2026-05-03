package vgfx

import "github.com/oidoid/void/src/void/vmath"

type Sprite struct {
	vmath.XY[float32]
	Radius     uint8
	R, G, B, A uint8
	Z          uint32
}

const MaxRadius = float32(16)

// holds a local copy of the sprite slice header and viewport so `Draw()` never
// touches the engine heap in a hot loop.
type SpriteBatch struct {
	Sprites  []Sprite
	Viewport vmath.Box[float32]
}

func (this *SpriteBatch) Draw(sprite *Sprite) {
	if !this.Viewport.HitsXY(sprite.XY) {
		return
	}
	n := len(this.Sprites)
	this.Sprites = this.Sprites[:n+1]
	this.Sprites[n] = *sprite
}
