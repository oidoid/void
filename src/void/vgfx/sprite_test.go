package vgfx

import (
	"testing"
	"unsafe"
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
