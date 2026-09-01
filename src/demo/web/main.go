package main

import (
	"github.com/oidoid/void/src/demo/app"
	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/void/vgame"
)

var gam *engine.Engine

func main() {
	println(engine.Version)
	gam = app.New()
}

//export FramePointer
func FramePointer() uintptr {
	return gam.FramePointer()
}

//export BeepPointer
func BeepPointer() uintptr { return gam.BeepPointer() }

//export BeepCount
func BeepCount() uint32 { return gam.BeepCount() }

//export FullscreenRequest
func FullscreenRequest() int32 {
	return gam.FullscreenRequest()
}

//export ScreenshotRequest
func ScreenshotRequest() int32 {
	return gam.ScreenshotRequest()
}

//export ContextLossRequest
func ContextLossRequest() int32 {
	return gam.ContextLossRequest()
}

//export DrawAlways
func DrawAlways() int32 {
	return gam.DrawAlwaysFlag()
}

//export RequestWakelock
func RequestWakelock() int32 { return gam.RequestWakelockFlag() }

//export RenderMode
func RenderMode() int32 { return gam.RenderModeFlag() }

//export UpdateInMillisRequest
func UpdateInMillisRequest() uint64 {
	return gam.UpdateInMillisRequest()
}

//export LayerConfigsPointer
func LayerConfigsPointer() uintptr { return gam.LayerConfigsPointer() }

//export Update
func Update() vgame.Status {
	return gam.Update()
}

//export BoardTilesPointer
func BoardTilesPointer() uintptr {
	return gam.BoardTilesPointer()
}

//export BoardW
func BoardW() int32 { return gam.BoardW() }

//export BoardH
func BoardH() int32 { return gam.BoardH() }

//export BoardTileW
func BoardTileW() uint8 { return gam.BoardTileW() }

//export BoardTileH
func BoardTileH() uint8 { return gam.BoardTileH() }

//export CamX
func CamX() float32 { return gam.CamX() }

//export CamY
func CamY() float32 { return gam.CamY() }

//export AtlasAnimCount
func AtlasAnimCount() uint32 { return gam.AtlasAnimCount() }

//export AtlasCelsPerAnim
func AtlasCelsPerAnim() uint32 { return gam.AtlasCelsPerAnim() }

//export AtlasCelsPointer
func AtlasCelsPointer() uintptr { return gam.AtlasCelsPointer() }

//export AtlasCelsCount
func AtlasCelsCount() uint32 { return gam.AtlasCelsCount() }
