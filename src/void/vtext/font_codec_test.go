package vtext

import (
	"reflect"
	"testing"
)

func TestFontRoundTrip(t *testing.T) {
	mem := MemProp5x6

	font := Font{
		ID:                       mem.ID,
		Name:                     mem.Name,
		CellW:                    mem.CellW,
		CellH:                    mem.CellH,
		Leading:                  mem.Leading,
		LineH:                    mem.LineH,
		Baseline:                 mem.Baseline,
		DefaultKerning:           mem.DefaultKerning,
		DefaultWhitespaceKerning: mem.DefaultWhitespaceKerning,
		EndOfLineKerning:         mem.EndOfLineKerning,
		DefaultCharW:             mem.DefaultCharW,
		FirstAnimID:              mem.FirstAnimID,
	}

	kerning := encodeKerning(mem.kerningPairs)
	widths := encodeWidths(&mem.charWidths, mem.DefaultCharW)
	descends := encodeDescends(descendsToMap(mem.descends))
	got := decodeFont(&font, kerning, widths, descends)

	if !reflect.DeepEqual(mem.kerningPairs, got.kerningPairs) {
		t.Error("kerningPairs mismatch")
	}
	if mem.charWidths != got.charWidths {
		t.Error("charWidths mismatch")
	}
	if mem.descends != got.descends {
		t.Error("descends mismatch")
	}
}

func descendsToMap(bits [32]uint8) map[byte]struct{} {
	m := make(map[byte]struct{})
	for i, word := range bits {
		for b := 0; b < 8; b++ {
			if word>>(b)&1 != 0 {
				m[byte(i*8+b)] = struct{}{}
			}
		}
	}
	return m
}
