package vlevels

import (
	"reflect"
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
)

func TestTilesRoundTrip(t *testing.T) {
	cases := map[string][]vatlas.AnimID{
		"empty":     {},
		"single":    {5},
		"allSame":   {2, 2, 2, 2},
		"mixed":     {1, 1, 0, 0, 0, 3, 1, 1},
		"noRepeats": {1, 2, 3, 4},
	}
	for name, tiles := range cases {
		t.Run(name, func(t *testing.T) {
			got := DecodeTiles(EncodeTiles(tiles))
			if len(got) == 0 && len(tiles) == 0 {
				return // nil vs empty slice; both are "no tiles".
			}
			if !reflect.DeepEqual(got, tiles) {
				t.Fatalf("got %v, want %v", got, tiles)
			}
		})
	}
}
