package ventities

import (
	"testing"

	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vtext"
)

func TestTextEntScale(t *testing.T) {
	font := vtext.MemProp5x6
	ent := TextEnt{Text: "1", Pal: 7}
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
