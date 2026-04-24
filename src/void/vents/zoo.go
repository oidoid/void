package vents

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
)

type Ent[Game vgame.Game] interface {
	Update(Game)
}

type Zoo[Game vgame.Game] struct {
	ents    []Ent[Game]
	sprites []vgfx.Sprite
}

func NewZoo[Game vgame.Game](maxSprites int) *Zoo[Game] {
	return &Zoo[Game]{
		sprites: make([]vgfx.Sprite, 0, maxSprites),
	}
}

func (this *Zoo[Game]) Add(ent Ent[Game]) {
	this.ents = append(this.ents, ent)
}

func (this *Zoo[Game]) AllocSprite() *vgfx.Sprite {
	if len(this.sprites) >= cap(this.sprites) {
		panic("sprite overflow")
	}
	this.sprites = this.sprites[:len(this.sprites)+1]
	sprite := &this.sprites[len(this.sprites)-1]
	return sprite
}

func (this *Zoo[Game]) SpritePointer() uintptr {
	if len(this.sprites) == 0 {
		return 0
	}
	return uintptr(unsafe.Pointer(&this.sprites[0]))
}

func (this *Zoo[Game]) SpriteCount() int {
	return len(this.sprites)
}

func (this *Zoo[Game]) Update(gam Game) {
	for _, ent := range this.ents {
		ent.Update(gam)
	}
}
