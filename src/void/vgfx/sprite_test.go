package vgfx

import (
	"testing"
	"unsafe"

	"github.com/oidoid/void/src/void/vatlas"
)

func TestSpriteLayout(t *testing.T) {
	var sprite Sprite

	if SpriteStride != 20 {
		t.Fatalf("SpriteStride = %d, want 20", SpriteStride)
	}
	if got := unsafe.Offsetof(sprite.AnimCel); got != 8 {
		t.Fatalf("AnimCel offset = %d, want 8", got)
	}
	if got := unsafe.Offsetof(sprite.Z); got != 10 {
		t.Fatalf("Z offset = %d, want 10", got)
	}
	if got := unsafe.Offsetof(sprite.WH); got != 12 {
		t.Fatalf("WH offset = %d, want 12", got)
	}
	if got := unsafe.Offsetof(sprite.flags); got != 16 {
		t.Fatalf("flags offset = %d, want 16", got)
	}
}

func TestSpritePal(t *testing.T) {
	sprite := Sprite{flags: spriteHiddenMask<<spriteHiddenShift |
		spriteFlipYMask<<spriteFlipYShift |
		spriteStretchMask<<spriteStretchShift}
	sprite.SetPal(vatlas.AnimID(0xff))
	if got := sprite.Pal(); got != 0xff {
		t.Fatalf("Pal() = %d, want %d", got, 0xff)
	}
	if sprite.flags&(spriteHiddenMask<<spriteHiddenShift|
		spriteFlipYMask<<spriteFlipYShift|
		spriteStretchMask<<spriteStretchShift) !=
		spriteHiddenMask<<spriteHiddenShift|
			spriteFlipYMask<<spriteFlipYShift|
			spriteStretchMask<<spriteStretchShift {
		t.Fatalf("SetPal() changed unrelated flags: %b", sprite.flags)
	}
	sprite.SetPal(0)
	if got := sprite.Pal(); got != 0 {
		t.Fatalf("Pal() = %d, want 0", got)
	}
}
