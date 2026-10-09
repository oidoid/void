package vgfx

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
)

func TestSprPal(t *testing.T) {
	spr := Spr{flags: sprHiddenMask<<sprHiddenShift |
		sprFlipYMask<<sprFlipYShift |
		sprStretchMask<<sprStretchShift}
	spr.SetPal(vatlas.Tag(0xff))
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
		sprPalTagMask<<sprPalTagShift}

	if spr.ZTop() {
		t.Fatal("ZTop() = true, want false")
	}

	spr.SetZTop(true)
	if !spr.ZTop() {
		t.Fatal("ZTop() = false, want true")
	}
	if spr.flags&(sprHiddenMask<<sprHiddenShift|
		sprPalTagMask<<sprPalTagShift) !=
		sprHiddenMask<<sprHiddenShift|
			sprPalTagMask<<sprPalTagShift {
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
