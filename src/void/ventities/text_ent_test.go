package ventities

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

func TestTextEntScale(t *testing.T) {
	font := vtext.MemProp5x6
	ent := TextEnt{Pal: 7}
	ent.SetText("1")
	ent.SetScale(2)
	var sprs []vgfx.Spr
	ent.Update(
		font,
		&sprs,
		vgeo.NewBox[float32](0, 0, 100, 100),
	)

	if got, want := ent.Layout.TrimLeadForceH, int16(font.CellH)*2; got != want {
		t.Errorf("layout height = %d, want %d", got, want)
	}
	if got, want := len(sprs), 1; got != want {
		t.Fatalf("spr count = %d, want %d", got, want)
	}
	if got, want := sprs[0].WH, vgeo.NewWH(
		uint16(font.CellW)*2,
		uint16(font.CellH)*2,
	); got != want {
		t.Errorf("spr WH = %+v, want %+v", got, want)
	}
	if !sprs[0].Stretch() {
		t.Error("scaled text spr is not stretched")
	}
	if got := sprs[0].Pal(); got != 7 {
		t.Errorf("spr palette = %d, want 7", got)
	}
}

func TestTextEntSetTextInvalidatesLayout(t *testing.T) {
	font := vtext.MemProp5x6
	ent := TextEnt{}
	ent.SetText("1")
	ent.LayoutChars(font)
	if ent.Layout.Chars == nil {
		t.Fatal("layout chars are nil after layout")
	}

	ent.SetText("12")
	if got, want := ent.Text(), "12"; got != want {
		t.Errorf("text = %q, want %q", got, want)
	}
	if ent.Layout.Chars != nil {
		t.Fatal("layout chars were not invalidated")
	}

	var sprs []vgfx.Spr
	ent.Update(font, &sprs, vgeo.NewBox[float32](0, 0, 100, 100))
	if got, want := len(sprs), 2; got != want {
		t.Errorf("spr count = %d, want %d", got, want)
	}
}

func TestTextEntClipPartialGlyph(t *testing.T) {
	font := vtext.MemProp5x6
	tests := []struct {
		name string
		xy   vgeo.XY[int16]
		want int
	}{
		{"overlaps left", vgeo.NewXY[int16](-1, 0), 1},
		{"touches left", vgeo.NewXY(-int16(font.CellW), int16(0)), 0},
		{"overlaps top", vgeo.NewXY[int16](0, -1), 1},
		{"touches top", vgeo.NewXY(int16(0), -int16(font.CellH)), 0},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ent := TextEnt{XY: test.xy}
			ent.SetText("1")
			var sprs []vgfx.Spr
			ent.Update(font, &sprs, vgeo.NewBox[float32](0, 0, 10, 10))
			if got := len(sprs); got != test.want {
				t.Errorf("spr count = %d, want %d", got, test.want)
			}
		})
	}
}
