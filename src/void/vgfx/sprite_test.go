package vgfx

import (
	"testing"
	"unsafe"
)

func TestSpriteLayout(t *testing.T) {
	var sprite Sprite

	if SpriteStride != 24 {
		t.Fatalf("SpriteStride = %d, want 24", SpriteStride)
	}
	if got := unsafe.Offsetof(sprite.AnimID); got != 8 {
		t.Fatalf("AnimID offset = %d, want 8", got)
	}
	if got := unsafe.Offsetof(sprite.Cel); got != 10 {
		t.Fatalf("Cel offset = %d, want 10", got)
	}
	if got := unsafe.Offsetof(sprite.Z); got != 12 {
		t.Fatalf("Z offset = %d, want 12", got)
	}
	if got := unsafe.Offsetof(sprite.flags); got != 16 {
		t.Fatalf("flags offset = %d, want 16", got)
	}
}
