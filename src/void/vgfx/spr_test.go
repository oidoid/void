package vgfx

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
)

func TestSprPauseRecordedCel(t *testing.T) {
	tests := []struct {
		name      string
		cel       uint8
		nowMillis float64
	}{
		{name: "zero cel", nowMillis: 312.5},
		{name: "recorded cel", cel: 5, nowMillis: 312.5},
		{name: "before tick", cel: 5, nowMillis: 62.4},
		{name: "tick", cel: 5, nowMillis: 62.5},
		{name: "offset wrap", cel: 15, nowMillis: 62.5},
		{name: "before clock wrap", cel: 5, nowMillis: 999},
		{name: "clock wrap", cel: 5, nowMillis: 1000},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			const tag = vatlas.Tag(0xabc)
			spr := Spr{TagCel: tag.Cel(test.cel)}
			spr.Pause(test.nowMillis)
			// resolve the cel with the unchanged sprite shader's clock.
			cel := (uint64(spr.TagCel) +
				uint64(test.nowMillis/vatlas.CelMillis)) &
				uint64(vatlas.TagCelMask)
			if cel != uint64(test.cel) {
				t.Fatalf("rendered cel = %d, want %d", cel, test.cel)
			}
			if spr.Tag() != tag {
				t.Fatalf("tag = %d, want %d", spr.Tag(), tag)
			}
		})
	}
}

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
