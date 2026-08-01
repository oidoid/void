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
	var sprites []vgfx.Sprite
	ent.Update(
		font,
		&sprites,
		vgeo.NewBox(float32(0), float32(0), float32(100), float32(100)),
	)

	if got, want := ent.Layout.TrimLeadForceH, int16(font.CellH)*2; got != want {
		t.Errorf("layout height = %d, want %d", got, want)
	}
	if got, want := len(sprites), 1; got != want {
		t.Fatalf("sprite count = %d, want %d", got, want)
	}
	if got, want := sprites[0].WH, (vgeo.WH[uint16]{
		W: uint16(font.CellW) * 2,
		H: uint16(font.CellH) * 2,
	}); got != want {
		t.Errorf("sprite WH = %+v, want %+v", got, want)
	}
	if !sprites[0].Stretch() {
		t.Error("scaled text sprite is not stretched")
	}
	if got := sprites[0].Pal(); got != 7 {
		t.Errorf("sprite palette = %d, want 7", got)
	}
}
