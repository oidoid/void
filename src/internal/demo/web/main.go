package main

import (
	"github.com/oidoid/void/src/internal/demo/app"
	"github.com/oidoid/void/src/internal/demo/engine"
	"github.com/oidoid/void/src/void/vgame"
)

var gam *engine.Eng

func main() {
	println("void " + engine.Version + " ───oidoid>°──")
	gam = app.New()
}

//export PollPtr
func PollPtr() uintptr {
	return gam.PollPtr()
}

//export BeepPtr
func BeepPtr() uintptr { return gam.BeepPtr() }

//export BeepCount
func BeepCount() uint32 { return gam.BeepCount() }

//export FullscreenReq
func FullscreenReq() int32 {
	return gam.FullscreenReq()
}

//export ScreenshotReq
func ScreenshotReq() int32 {
	return gam.ScreenshotReq()
}

//export ContextLossReq
func ContextLossReq() int32 {
	return gam.ContextLossReq()
}

//export DrawAlways
func DrawAlways() int32 {
	return gam.DrawAlwaysFlag()
}

//export DrawOnBlur
func DrawOnBlur() int32 { return gam.DrawOnBlurFlag() }

//export ReqWakelock
func ReqWakelock() int32 { return gam.ReqWakelockFlag() }

//export RenderMode
func RenderMode() int32 { return gam.RenderModeFlag() }

//export UpdateInMillisReq
func UpdateInMillisReq() uint64 {
	return gam.UpdateInMillisReq()
}

//export LayerConfigsPtr
func LayerConfigsPtr() uintptr { return gam.LayerConfigsPtr() }

//export Update
func Update() vgame.Status {
	return gam.Update()
}

//export BoardTilesPtr
func BoardTilesPtr() uintptr {
	return gam.BoardTilesPtr()
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

//export AtlasCelsPtr
func AtlasCelsPtr() uintptr { return gam.AtlasCelsPtr() }

//export AtlasCelsCount
func AtlasCelsCount() uint32 { return gam.AtlasCelsCount() }
