package vatlas_test

import (
	"reflect"
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vmath"
)

func TestDecodeAtlas_empty(t *testing.T) {
	assertRoundTrip(t, vatlas.NewAtlas([]vatlas.Anim{}, []uint16{}))
}

func TestDecodeAtlas_singleAnimNoCels(t *testing.T) {
	assertRoundTrip(t, vatlas.NewAtlas(
		[]vatlas.Anim{{Cels: 1, W: 0, H: 0}}, []uint16{0, 0},
	))
}

func TestDecodeAtlas_multiCelAnim(t *testing.T) {
	assertRoundTrip(t, vatlas.NewAtlas(
		[]vatlas.Anim{{Cels: 8, W: 16, H: 24}},
		[]uint16{
			10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160,
		},
	))
}

func TestDecodeAtlas_hitboxOnly(t *testing.T) {
	assertRoundTrip(t, vatlas.NewAtlas(
		[]vatlas.Anim{{Cels: 1, W: 8, H: 8, Hitbox: vmath.XYWH[uint16](1, 2, 3, 4)}},
		[]uint16{0, 0},
	))
}

func TestDecodeAtlas_hurtboxOnly(t *testing.T) {
	assertRoundTrip(t, vatlas.NewAtlas(
		[]vatlas.Anim{{Cels: 1, W: 8, H: 8, Hurtbox: vmath.XYWH[uint16](5, 6, 7, 8)}},
		[]uint16{0, 0},
	))
}

func TestDecodeAtlas_hitboxAndHurtbox(t *testing.T) {
	assertRoundTrip(t, vatlas.NewAtlas(
		[]vatlas.Anim{{
			Cels: 1, W: 16, H: 16,
			Hitbox:  vmath.XYWH[uint16](1, 2, 3, 4),
			Hurtbox: vmath.XYWH[uint16](5, 6, 7, 8),
		}},
		[]uint16{0, 0},
	))
}

func TestDecodeAtlas_multipleAnims(t *testing.T) {
	assertRoundTrip(t, vatlas.NewAtlas(
		[]vatlas.Anim{{Cels: 1, W: 0, H: 0}, {Cels: 2, W: 8, H: 8}},
		[]uint16{0, 0, 100, 0, 108, 0},
	))
}

func TestDecodeAtlas_rleDecompressed(t *testing.T) {
	assertRoundTrip(t, vatlas.NewAtlas(
		[]vatlas.Anim{{Cels: 4, W: 4, H: 4}},
		[]uint16{200, 100, 200, 100, 200, 100, 200, 100},
	))
}

func assertRoundTrip(t *testing.T, want vatlas.Atlas) {
	t.Helper()
	got := vatlas.DecodeAtlas(vatlas.EncodeAtlas(&want))
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %+v, want %+v", got, want)
	}
}
