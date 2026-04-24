package vents

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgfx"
)

const MaxSprites = 1024 * 1024

type Ent[Game vgame.Game] interface {
	Update(Game)
}

type Zoo[Game vgame.Game] struct {
	ents    []Ent[Game]
	sprites [MaxSprites]vgfx.Sprite
	len     int
}

func (this *Zoo[Game]) Update(game Game) {
	for _, ent := range this.ents {
		ent.Update(game)
	}
}

func (this *Zoo[Game]) Alloc() *vgfx.Sprite {
	sprite := &this.sprites[this.len]
	this.len++
	return sprite
}

func (this *Zoo[Game]) Add(ent Ent[Game]) {
	this.ents = append(this.ents, ent)
}

func (this *Zoo[Game]) SpritePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.sprites[0]))
}

func (this *Zoo[Game]) SpriteCount() int {
	return this.len
}
