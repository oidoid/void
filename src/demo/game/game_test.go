package game_test

import (
	"testing"

	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/entities"
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/void/vgeo"
)

const (
	superballCount  = 2*1024*1024 - 100 // - 100 for misc non-superballs.
	benchCanvasSize = 4096
	fps             = 120
)

func BenchmarkGameUpdate_CullAll(b *testing.B) {
	gam := newGame(-5000, -5000)
	for b.Loop() {
		gam.Frame().NowMs += 1000. / fps
		gam.Update()
	}
	reportMetrics(b)
}

func BenchmarkGameUpdate_DrawAll(b *testing.B) {
	gam := newGame(0, 0)
	for b.Loop() {
		gam.Frame().NowMs += 1000. / fps
		gam.Update()
	}
	reportMetrics(b)
}

func newGame(camX, camY float32) *engine.Engine {
	gam := game.New()
	gam.CanvasPhy().W = benchCanvasSize
	gam.CanvasPhy().H = benchCanvasSize
	gam.Cam().X = camX
	gam.Cam().Y = camY
	gam.Frame().DeltaMs = 1000. / fps
	for i := range superballCount {
		ball := entities.NewBallEnt(
			gam.Random,
			vgeo.NewXY(float32(i%benchCanvasSize), float32(i/benchCanvasSize)),
		)
		gam.Balls.Add(ball)
	}
	return gam
}

func reportMetrics(b *testing.B) {
	b.Helper()
	b.ReportMetric(0, "ns/op")
	millisPerLoop := float64(b.Elapsed().Nanoseconds()) / float64(b.N) / 1e6
	b.ReportMetric(millisPerLoop, "ms/op")
}
