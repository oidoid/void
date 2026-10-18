package vgfx_test

import (
	"testing"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/veng"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

func TestAnimOwnsCelAndRetainsDrawingFields(t *testing.T) {
	atlas := vatlas.NewAtlas([]vatlas.TagMeta{
		{Cels: 3, Dir: vatlas.AnimDirReverse}, {Cels: 3},
	}, []vatlas.Cel{
		{Millis: 100}, {Millis: 100}, {Millis: 100},
		{Millis: 100}, {Millis: 100}, {Millis: 100},
	})
	anim := vgfx.Anim{Spr: vgfx.Spr{Cel: 1}}
	anim.Update(&atlas, 0)
	if anim.Cel != 2 {
		t.Fatal("initial cel overrode the authored starting cel")
	}
	anim.XY = vgeo.NewXY[float32](3, 4)
	anim.WH = vgeo.NewWH[uint16](8, 13)
	anim.Z = vgfx.Z(7)
	anim.SetFlipX(true)
	anim.SetTag(1)
	want := anim.Spr
	want.Cel = 0
	anim.Update(&atlas, 0)
	if anim.Spr != want || anim.Done() {
		t.Fatal("tag change did not reset playback and preserve drawing fields")
	}
	anim.Update(&atlas, 100)
	anim.Reset()
	anim.Update(&atlas, 0)
	if anim.Spr != want || anim.Done() {
		t.Fatal("reset did not preserve drawing fields")
	}
}

func TestAnimPlaybackStatus(t *testing.T) {
	atlas := vatlas.NewAtlas([]vatlas.TagMeta{
		{Cels: 2, Dir: vatlas.AnimDirReverse, Repeat: 1},
		{Cels: 1},
		{Cels: 1, Repeat: 1},
	}, []vatlas.Cel{
		{Millis: 100}, {Millis: 250}, {Millis: 100}, {Millis: 100},
	})
	var anim vgfx.Anim
	for _, test := range []struct {
		delta  float64
		cel    uint8
		status veng.Status
		done   bool
	}{
		{0, 1, veng.Loop, false},
		{250, 0, veng.Loop, false},
		{100, 0, veng.Pause, true},
		{1000, 0, veng.Pause, true},
	} {
		anim.SetTag(0)
		status := anim.Update(&atlas, test.delta)
		if status != test.status || anim.Cel != test.cel || anim.Done() != test.done {
			t.Fatalf("after %g ms: status %v, cel %d, done %v",
				test.delta, status, anim.Cel, anim.Done())
		}
	}
	anim.Reset()
	if anim.Update(&atlas, 0) != veng.Loop || anim.Cel != 1 || anim.Done() {
		t.Fatal("restart did not restore reverse playback")
	}
	anim.SetTag(1)
	if anim.Update(&atlas, 0) != veng.Pause || anim.Cel != 0 || anim.Done() {
		t.Fatal("static tag should pause without completing")
	}
	anim.SetTag(2)
	if anim.Update(&atlas, 99) != veng.Loop || anim.Done() {
		t.Fatal("finite single cel should complete its duration")
	}
	if anim.Update(&atlas, 1) != veng.Pause || !anim.Done() {
		t.Fatal("finite single cel did not complete")
	}
	anim.SetTag(1)
	if anim.Done() || anim.Tag != 1 || anim.Update(&atlas, 0) != veng.Pause {
		t.Fatal("tag change did not resume a finished animation")
	}
}

func TestAnimUnequalDurationsByDirection(t *testing.T) {
	durations := [...]uint16{100, 250, 50}
	for _, test := range []struct {
		name string
		dir  vatlas.AnimDir
		want []uint8
	}{
		{"forward", vatlas.AnimDirForward, []uint8{0, 1, 2, 0, 1}},
		{"reverse", vatlas.AnimDirReverse, []uint8{2, 1, 0, 2, 1}},
		{"ping pong", vatlas.AnimDirPingPong, []uint8{0, 1, 2, 1, 0, 1}},
		{"reverse ping pong", vatlas.AnimDirPingPongReverse, []uint8{2, 1, 0, 1, 2, 1}},
	} {
		t.Run(test.name, func(t *testing.T) {
			atlas := vatlas.NewAtlas([]vatlas.TagMeta{{Cels: 3, Dir: test.dir}}, []vatlas.Cel{
				{Millis: durations[0]}, {Millis: durations[1]}, {Millis: durations[2]},
			})
			var player vgfx.Anim
			player.Update(&atlas, 0)
			if got := player.Cel; got != test.want[0] {
				t.Fatalf("starting cel = %d, want %d", got, test.want[0])
			}
			for i := 1; i < len(test.want); i++ {
				cel := test.want[i-1]
				player.Update(&atlas, float64(durations[cel])-.5)
				if got := player.Cel; got != cel {
					t.Fatalf("step %d advanced early: cel %d, want %d", i, got, cel)
				}
				player.Update(&atlas, .5)
				if got := player.Cel; got != test.want[i] {
					t.Fatalf("step %d boundary: cel %d, want %d", i, got, test.want[i])
				}
			}
			period := float64(400)
			if test.dir >= vatlas.AnimDirPingPong {
				period = 650
			}
			player.Update(&atlas, period*1000000)
			if player.Cel != test.want[len(test.want)-1] || player.Done() {
				t.Fatal("skipping whole loops changed playback position")
			}
		})
	}
}

func TestAnimDirectionsAndRepeats(t *testing.T) {
	for _, test := range []struct {
		name   string
		dir    vatlas.AnimDir
		repeat uint8
		want   []uint8
		done   bool
	}{
		{"forward", vatlas.AnimDirForward, 0, []uint8{0, 1, 2, 0, 1, 2, 0}, false},
		{"reverse", vatlas.AnimDirReverse, 0, []uint8{2, 1, 0, 2, 1, 0, 2}, false},
		{"ping pong", vatlas.AnimDirPingPong, 0, []uint8{0, 1, 2, 1, 0, 1, 2}, false},
		{"reverse ping pong", vatlas.AnimDirPingPongReverse, 0, []uint8{2, 1, 0, 1, 2, 1, 0}, false},
		{"once", vatlas.AnimDirForward, 1, []uint8{0, 1, 2, 2, 2}, true},
		{"twice", vatlas.AnimDirForward, 2, []uint8{0, 1, 2, 0, 1, 2, 2}, true},
		{"reverse once", vatlas.AnimDirReverse, 1, []uint8{2, 1, 0, 0}, true},
		{"ping pong one leg", vatlas.AnimDirPingPong, 1, []uint8{0, 1, 2, 2}, true},
		{"ping pong two legs", vatlas.AnimDirPingPong, 2, []uint8{0, 1, 2, 1, 0, 0}, true},
		{"ping pong three legs", vatlas.AnimDirPingPong, 3, []uint8{0, 1, 2, 1, 0, 1, 2, 2}, true},
		{"reverse ping pong twice", vatlas.AnimDirPingPongReverse, 2, []uint8{2, 1, 0, 1, 2, 2}, true},
	} {
		t.Run(test.name, func(t *testing.T) {
			atlas := vatlas.NewAtlas([]vatlas.TagMeta{{Cels: 3, Dir: test.dir, Repeat: test.repeat}},
				[]vatlas.Cel{{Millis: 100}, {Millis: 100}, {Millis: 100}})
			var player vgfx.Anim
			for i, want := range test.want {
				delta := float64(100)
				if i == 0 {
					delta = 0
				}
				player.Update(&atlas, delta)
				if got := player.Cel; got != want {
					t.Fatalf("step %d = %d, want %d", i, got, want)
				}
			}
			if player.Done() != test.done {
				t.Fatalf("done = %v, want %v", player.Done(), test.done)
			}
		})
	}
}

func TestAnimTimingPauseRestartAndTagChange(t *testing.T) {
	atlas := vatlas.NewAtlas([]vatlas.TagMeta{{Cels: 3}, {Cels: 2, Dir: vatlas.AnimDirReverse}},
		[]vatlas.Cel{{Millis: 100}, {Millis: 250}, {Millis: 50}, {Millis: 75}, {Millis: 150}})
	var player vgfx.Anim
	for _, test := range []struct {
		delta float64
		want  uint8
	}{
		{0, 0}, {99.5, 0}, {0, 0}, {.5, 1}, {249, 1}, {1, 2}, {50, 0},
		{400000100, 1}, {-100, 1}, {0, 1},
	} {
		player.Update(&atlas, test.delta)
		if got := player.Cel; got != test.want {
			t.Fatalf("after %g ms = %d, want %d", test.delta, got, test.want)
		}
	}
	player.SetTag(1)
	player.Update(&atlas, 0)
	if got := player.Cel; got != 1 {
		t.Fatal("tag did not start in reverse")
	}
	player.Update(&atlas, 150)
	player.Reset()
	player.Update(&atlas, 0)
	if got := player.Cel; got != 1 {
		t.Fatal("restart lost source direction")
	}
}

func TestAnimSingleCel(t *testing.T) {
	for _, repeat := range []uint8{0, 1} {
		atlas := vatlas.NewAtlas([]vatlas.TagMeta{{Cels: 1, Repeat: repeat}},
			[]vatlas.Cel{{Millis: 1}})
		var anim vgfx.Anim
		for range 2 {
			status := anim.Update(&atlas, 1000000)
			if status != veng.Pause || anim.Cel != 0 || anim.Done() != (repeat != 0) {
				t.Fatalf("repeat %d: status %v, cel %d, done %v",
					repeat, status, anim.Cel, anim.Done())
			}
		}
	}
}

func TestAnimMaxCelsAndRepeats(t *testing.T) {
	for _, test := range []struct {
		dir    vatlas.AnimDir
		millis float64
		cel    uint8
	}{
		{vatlas.AnimDirForward, 6502500, 254},
		{vatlas.AnimDirReverse, 6502500, 0},
		{vatlas.AnimDirPingPong, 6477100, 254},
		{vatlas.AnimDirPingPongReverse, 6477100, 0},
	} {
		cels := make([]vatlas.Cel, 255)
		for i := range cels {
			cels[i].Millis = 100
		}
		atlas := vatlas.NewAtlas([]vatlas.TagMeta{{
			Cels: 255, Repeat: 255, Dir: test.dir,
		}}, cels)
		var player vgfx.Anim
		player.Update(&atlas, test.millis-.5)
		if player.Cel != test.cel || player.Done() {
			t.Fatalf("dir %d: stopped early at cel %d", test.dir, player.Cel)
		}
		player.Update(&atlas, .5)
		if player.Cel != test.cel || !player.Done() {
			t.Fatalf("dir %d: did not finish on cel %d", test.dir, test.cel)
		}
	}
}
