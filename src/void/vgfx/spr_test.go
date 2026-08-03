package vgfx

import (
	"testing"
	"unsafe"

	"github.com/oidoid/void/src/void/vatlas"
)

func TestSprLayout(t *testing.T) {
	var spr Spr

	if SprStride != 20 {
		t.Fatalf("SprStride = %d, want 20", SprStride)
	}
	if got := unsafe.Offsetof(spr.AnimCel); got != 8 {
		t.Fatalf("AnimCel offset = %d, want 8", got)
	}
	if got := unsafe.Offsetof(spr.Z); got != 10 {
		t.Fatalf("Z offset = %d, want 10", got)
	}
	if got := unsafe.Offsetof(spr.WH); got != 12 {
		t.Fatalf("WH offset = %d, want 12", got)
	}
	if got := unsafe.Offsetof(spr.flags); got != 16 {
		t.Fatalf("flags offset = %d, want 16", got)
	}
}

func TestSprPal(t *testing.T) {
	spr := Spr{flags: sprHiddenMask<<sprHiddenShift |
		sprFlipYMask<<sprFlipYShift |
		sprStretchMask<<sprStretchShift}
	spr.SetPal(vatlas.AnimID(0xff))
	if got := spr.Pal(); got != 0xff {
		t.Fatalf("Pal() = %d, want %d", got, 0xff)
	}
	if spr.flags&(sprHiddenMask<<sprHiddenShift|
		sprFlipYMask<<sprFlipYShift|
		sprStretchMask<<sprStretchShift) !=
		sprHiddenMask<<sprHiddenShift|
			sprFlipYMask<<sprFlipYShift|
			sprStretchMask<<sprStretchShift {
		t.Fatalf("SetPal() changed unrelated flags: %b", spr.flags)
	}
	spr.SetPal(0)
	if got := spr.Pal(); got != 0 {
		t.Fatalf("Pal() = %d, want 0", got)
	}
}

func TestSprZTop(t *testing.T) {
	spr := Spr{flags: sprHiddenMask<<sprHiddenShift |
		sprPalAnimMask<<sprPalAnimShift}

	if spr.ZTop() {
		t.Fatal("ZTop() = true, want false")
	}

	spr.SetZTop(true)
	if !spr.ZTop() {
		t.Fatal("ZTop() = false, want true")
	}
	if spr.flags&(sprHiddenMask<<sprHiddenShift|
		sprPalAnimMask<<sprPalAnimShift) !=
		sprHiddenMask<<sprHiddenShift|
			sprPalAnimMask<<sprPalAnimShift {
		t.Fatalf("SetZTop(true) changed unrelated flags: %b", spr.flags)
	}

	spr.SetZTop(false)
	if spr.ZTop() {
		t.Fatal("ZTop() = true, want false")
	}
}

func TestSprRot(t *testing.T) {
	spr := Spr{flags: sprHiddenMask << sprHiddenShift}
	spr.SetRot(sprRotRadians * 1024)
	if got, want := spr.Rot(), sprRotRadians*1024; got != want {
		t.Fatalf("Rot() = %f, want %f", got, want)
	}
	if spr.flags&sprHiddenMask<<sprHiddenShift == 0 {
		t.Fatal("SetRot() cleared Hidden")
	}
	spr.SetRot(-sprRotRadians)
	if got, want := spr.Rot(), sprRotRadians*4095; got != want {
		t.Fatalf("Rot() = %f, want %f", got, want)
	}
}
