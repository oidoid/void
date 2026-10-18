package vatlas_test

import (
	"reflect"
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
)

func TestAtlasRoundTrip(t *testing.T) {
	for _, dir := range []vatlas.AnimDir{
		vatlas.AnimDirForward, vatlas.AnimDirReverse,
		vatlas.AnimDirPingPong, vatlas.AnimDirPingPongReverse,
	} {
		for _, repeat := range []uint8{0, 1, 2, 255} {
			atlas := vatlas.NewAtlas([]vatlas.TagMeta{
				{Cels: 1, WH: vgeo.NewWH[uint16](1, 1)},
				{Cels: 3, WH: vgeo.NewWH[uint16](8, 13), Dir: dir, Repeat: repeat,
					Hitbox:  vgeo.XYWH[uint16](1, 2, 3, 4),
					Hurtbox: vgeo.XYWH[uint16](5, 6, 7, 8)},
				{Cels: 1, WH: vgeo.NewWH[uint16](4, 5), Hurtbox: vgeo.XYWH[uint16](0, 1, 2, 3)},
			}, []vatlas.Cel{
				{}, {XY: vgeo.NewXY[uint16](10, 20), Millis: 100},
				{XY: vgeo.NewXY[uint16](10, 20), Millis: 250},
				{XY: vgeo.NewXY[uint16](30, 40), Millis: 50},
				{XY: vgeo.NewXY[uint16](50, 60), Millis: 65535},
			})
			assertRoundTrip(t, atlas)
			if got := atlas.Cel(1, 1); got.Millis != 250 || got.X != 10 || got.Y != 20 {
				t.Fatalf("authored cel = %+v", got)
			}
			if atlas.Meta[2].CelIndex != 4 || len(atlas.Cels) != 5 {
				t.Fatalf("atlas added padding: %+v", atlas)
			}
		}
	}
	assertRoundTrip(t, vatlas.NewAtlas([]vatlas.TagMeta{}, []vatlas.Cel{}))
}

func TestAtlasMaxCels(t *testing.T) {
	// 257 tags of 255 cels reach the atlas-wide uint16 limit.
	metas := make([]vatlas.TagMeta, 257)
	cels := make([]vatlas.Cel, len(metas)*int(vatlas.MaxCels))
	for i := range metas {
		metas[i] = vatlas.TagMeta{Cels: vatlas.MaxCels, WH: vgeo.NewWH[uint16](1, 2)}
	}
	for i := range cels {
		cels[i] = vatlas.Cel{XY: vgeo.NewXY(uint16(i), uint16(i>>16)), Millis: uint16(i)}
	}
	atlas := vatlas.NewAtlas(metas, cels)
	if got := atlas.Cel(256, 254); got.X != 65534 || got.Y != 0 {
		t.Fatalf("last supported cel = %+v", got)
	}
	assertRoundTrip(t, atlas)
}

func assertRoundTrip(t *testing.T, want vatlas.Atlas) {
	t.Helper()
	got := vatlas.DecodeAtlas(vatlas.EncodeAtlas(&want))
	if !reflect.DeepEqual(got, want) {
		t.Fatal("atlas round trip changed source data")
	}
}
