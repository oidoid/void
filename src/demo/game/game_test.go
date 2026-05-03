package game_test

import (
	"testing"

	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/ents"
	"github.com/oidoid/void/src/demo/game"
)

const (
	ballCount       = 2 * 1024 * 1024
	benchCanvasSize = 4096
)

func BenchmarkGameUpdate_CullAll(b *testing.B) {
	gam := newGame(-5000, -5000)
	for b.Loop() {
		gam.Frame().NowMs += 1000. / 120
		gam.Update()
	}
	reportMetrics(b)
}

func BenchmarkGameUpdate_DrawAll(b *testing.B) {
	gam := newGame(0, 0)
	for b.Loop() {
		gam.Frame().NowMs += 1000. / 120
		gam.Update()
	}
	reportMetrics(b)
}

func newGame(camX, camY float32) *engine.Engine {
	gam := game.New()
	gam.Canvas().W = benchCanvasSize
	gam.Canvas().H = benchCanvasSize
	gam.Cam().X = camX
	gam.Cam().Y = camY
	gam.Frame().DeltaMs = 1000. / 120
	for i := range ballCount {
		ball := ents.NewBallEnt(gam.Random, float32(i%benchCanvasSize), float32(i/benchCanvasSize))
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
