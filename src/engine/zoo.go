package void

import "unsafe"

const MaxSprites = 1024 * 1024

// Ent is a generic entity managed by Zoo.
type Ent interface {
	Update(w, h int)
	Sprite() Sprite
}

type Zoo struct {
	count   int
	ents    [MaxSprites]Ent
	sprites [MaxSprites]Sprite
}

func NewZoo() *Zoo {
	return &Zoo{}
}

func (this *Zoo) Update(frame *Frame) {
	w, h := int(frame.CanvasW), int(frame.CanvasH)
	for i := range this.count {
		this.ents[i].Update(w, h)
		this.sprites[i] = this.ents[i].Sprite()
	}
}

func (this *Zoo) Add(ent Ent) {
	if this.count >= MaxSprites {
		return
	}
	this.ents[this.count] = ent
	this.count++
}

func (this *Zoo) SpritePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.sprites[0]))
}

func (this *Zoo) SpriteCount() uint32 {
	return uint32(this.count)
}
