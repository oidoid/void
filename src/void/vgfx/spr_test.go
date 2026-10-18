package vgfx

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
)

func TestSprLayout(t *testing.T) {
	if SprStride != 20 {
		t.Fatalf("sprite stride = %d, want 20", SprStride)
	}
	spr := Spr{Tag: 4095, Cel: 255, Z: Layer(7).Z(15)}
	spr.SetRot(sprRotRadians * 4095)
	spr.SetPal(255)
	spr.Hide(true)
	spr.SetFlipX(true)
	spr.SetFlipY(true)
	spr.SetStretch(true)
	spr.SetZTop(true)
	if spr.Tag != 4095 || spr.Cel != 255 || spr.Z != Layer(7).Z(15) {
		t.Fatal("flags changed tag, cel, or draw order")
	}
}

func TestSprPal(t *testing.T) {
	spr := Spr{Tag: 4095}
	spr.Hide(true)
	spr.SetFlipY(true)
	spr.SetStretch(true)
	spr.SetPal(vatlas.Tag(0xff))
	if got := spr.Pal(); got != 0xff {
		t.Fatalf("Pal() = %d, want %d", got, 0xff)
	}
	if !spr.Hidden() || !spr.FlipY() || !spr.Stretch() || spr.Tag != 4095 {
		t.Fatal("SetPal() changed unrelated fields")
	}
	spr.SetPal(0)
	if got := spr.Pal(); got != 0 {
		t.Fatalf("Pal() = %d, want 0", got)
	}
}

func TestSprZTop(t *testing.T) {
	spr := Spr{Tag: 4095}
	spr.Hide(true)
	spr.SetPal(255)

	if spr.ZTop() {
		t.Fatal("ZTop() = true, want false")
	}

	spr.SetZTop(true)
	if !spr.ZTop() {
		t.Fatal("ZTop() = false, want true")
	}
	if !spr.Hidden() || spr.Pal() != 255 || spr.Tag != 4095 {
		t.Fatal("SetZTop(true) changed unrelated fields")
	}

	spr.SetZTop(false)
	if spr.ZTop() {
		t.Fatal("ZTop() = true, want false")
	}
}

func TestSprRot(t *testing.T) {
	spr := Spr{Tag: 4095}
	spr.Hide(true)
	spr.SetRot(sprRotRadians * 1024)
	if got, want := spr.Rot(), sprRotRadians*1024; got != want {
		t.Fatalf("Rot() = %f, want %f", got, want)
	}
	if !spr.Hidden() || spr.Tag != 4095 {
		t.Fatal("SetRot() cleared Hidden")
	}
	spr.SetRot(-sprRotRadians)
	if got, want := spr.Rot(), sprRotRadians*4095; got != want {
		t.Fatalf("Rot() = %f, want %f", got, want)
	}
}
