package vgeo

import "testing"

func TestDirXY(t *testing.T) {
	for _, test := range []struct {
		dir  Dir
		want XY[int8]
	}{
		{DirE, NewXY[int8](1, 0)},
		{DirNE, NewXY[int8](1, -1)},
		{DirN, NewXY[int8](0, -1)},
		{DirNW, NewXY[int8](-1, -1)},
		{DirW, NewXY[int8](-1, 0)},
		{DirSW, NewXY[int8](-1, 1)},
		{DirS, NewXY[int8](0, 1)},
		{DirSE, NewXY[int8](1, 1)},
		{DirCenter, NewXY[int8](0, 0)},
	} {
		if got := test.dir.XY(); got != test.want {
			t.Errorf("Dir(%d).XY() = %v, want %v", test.dir, got, test.want)
		}
	}
}
