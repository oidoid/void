package app

import (
	"testing"

	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

const (
	superballDrawCount    = 2 * 1024 * 1024
	superballHitDrawCount = superballDrawCount / 16
	benchCanvasSize       = 4096
	fps                   = 120
)

func BenchmarkGameUpdate_Draw(b *testing.B) {
	gam := newGame(-5000, -5000, superballDrawCount)
	for b.Loop() {
		gam.Poll().NowMillis += 1000. / fps
		gam.Update()
	}
	reportMetrics(b)
}

func BenchmarkGameUpdate_HitDraw(b *testing.B) {
	gam := newGame(-5000, -5000, superballHitDrawCount)
	for b.Loop() {
		gam.HitSuperballs = true
		gam.Poll().NowMillis += 1000. / fps
		gam.Update()
	}
	reportMetrics(b)
}

func newGame(camX, camY float32, superballCount int) *engine.Eng {
	gam := New()
	// pre-size the superballs sprite buffer so the benchmark measures
	// steady-state draw performance rather than slice growth.
	gam.Layer(gfx.LayerSuperballs).Sprs = make([]vgfx.Spr, 0, superballCount)
	gam.CanvasPhy().W = benchCanvasSize
	gam.CanvasPhy().H = benchCanvasSize
	gam.Cam().X = camX
	gam.Cam().Y = camY
	gam.Poll().DeltaMillis = 1000. / fps
	for i := range superballCount {
		superball := entities.NewSuperballEnt(
			gam.Random,
			vgeo.NewXY(float32(i%benchCanvasSize), float32(i/benchCanvasSize)),
		)
		gam.Superballs.Add(superball)
	}
	return gam
}

func reportMetrics(b *testing.B) {
	b.Helper()
	b.ReportMetric(0, "ns/op")
	millisPerLoop := float64(b.Elapsed().Nanoseconds()) / float64(b.N) / 1e6
	b.ReportMetric(millisPerLoop, "ms/op")
}
