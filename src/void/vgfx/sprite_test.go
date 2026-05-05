package vgfx

import (
	"testing"
	"unsafe"
)

func TestSpriteLayout(t *testing.T) {
	var sprite Sprite

	if SpriteStride != 32 {
		t.Fatalf("SpriteStride = %d, want 32", SpriteStride)
	}
	if got := unsafe.Offsetof(sprite.Radius); got != 8 {
		t.Fatalf("Radius offset = %d, want 8", got)
	}
	if got := unsafe.Offsetof(sprite.R); got != 9 {
		t.Fatalf("R offset = %d, want 9", got)
	}
	if got := unsafe.Offsetof(sprite.Z); got != 16 {
		t.Fatalf("Z offset = %d, want 16", got)
	}
	if got := unsafe.Offsetof(sprite.flags); got != 24 {
		t.Fatalf("flags offset = %d, want 24", got)
	}
}
