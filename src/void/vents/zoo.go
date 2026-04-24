package vents

import (
	"unsafe"

	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/vgfx"
)

const MaxSprites = 1024 * 1024

// Ent is a generic entity managed by Zoo.
type Ent interface {
	Update(w, h int)
}

type Zoo struct {
	ents    []Ent
	sprites [MaxSprites]vgfx.Sprite
	len     int
}

func (this *Zoo) Update(frame *vengine.Frame) {
	w, h := int(frame.CanvasW), int(frame.CanvasH)
	for _, ent := range this.ents {
		ent.Update(w, h)
	}
}

func (this *Zoo) Alloc() *vgfx.Sprite {
	sprite := &this.sprites[this.len]
	this.len++
	return sprite
}

func (this *Zoo) Add(ent Ent) {
	this.ents = append(this.ents, ent)
}

func (this *Zoo) SpritePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.sprites[0]))
}

func (this *Zoo) SpriteCount() int {
	return this.len
}
