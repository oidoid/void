// ╭>°╮┬┌─╮╭─╮┬┌─╮
// ╰──╰┴╯─╯╰─╰┴╯─╯
package vengine

import (
	"unsafe"

	"math/rand/v2"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
	"github.com/oidoid/void/src/void/vtext"
)

// to-do: rename Eng.
type Engine[Game vgame.Game] struct {
	BoardData          *vboards.Board
	Router             vgame.Router[Game]
	Atlas              vatlas.Atlas
	Texts              ventities.EntVec[Game, ventities.TextEnt]
	Cursor             *ventities.CursorEnt
	font               *vtext.Font
	frame              vgame.Poll
	in                 *vin.In
	cam                vgeo.XY[float32] // to-do: cam always moves in physical space.
	preupdaters        ventities.Zoo[Game]
	updaters           ventities.Zoo[Game]
	rnd                *rand.Rand
	layers             [vgfx.LayerCount]vgfx.LayerConfig
	layerConfigExport  [vgfx.LayerCount]vgfx.LayerConfigExport
	fullscreenRequest  vgame.FullscreenRequest
	screenshotRequest  bool
	contextLossRequest bool
	beeps              [16]vgame.Beep
	beepCount          uint32
	updateInMillis     uint64
	drawAlways         bool
	disableFullscreen  bool
	disableWakelock    bool
	renderMode         vgfx.RenderMode
	tick               vgame.Tick
}

type EngineOpts struct {
	RenderMode vgfx.RenderMode
	Font       *vtext.Font
	Board      *vboards.Board
	MaxSprs    int
	Seed1      uint64
	Seed2      uint64
}

func New[Game vgame.Game](opts *EngineOpts) *Engine[Game] {
	if opts == nil {
		opts = &EngineOpts{}
	}
	if opts.MaxSprs == 0 {
		opts.MaxSprs = 16 * 1024
	}
	if opts.Seed1 == 0 {
		opts.Seed1 = rand.Uint64()
	}
	if opts.Seed2 == 0 {
		opts.Seed2 = rand.Uint64()
	}
	this := &Engine[Game]{
		font:              opts.Font,
		BoardData:         opts.Board,
		in:                vin.NewIn(),
		rnd:               rand.New(rand.NewPCG(opts.Seed1, opts.Seed2)),
		fullscreenRequest: vgame.FullscreenRequestEnter,
		renderMode:        opts.RenderMode,
	}
	for i := range this.layers {
		this.layers[i] = vgfx.NewLayerConfig(opts.MaxSprs)
	}

	return this
}

func (this *Engine[Game]) Random() float32 { return this.rnd.Float32() }

func (this *Engine[Game]) Beep(beep vgame.Beep) {
	if this.beepCount == uint32(len(this.beeps)) {
		return
	}
	this.beeps[this.beepCount] = beep
	this.beepCount++
}

func (this *Engine[Game]) RegisterEntUpdate(vec ventities.Updater[Game]) {
	this.RegisterUpdate(vec)
}

func (this *Engine[Game]) RegisterPreupdate(fn func(Game) vgame.Status) {
	this.preupdaters.Register(ventities.UpdaterFunc[Game](fn))
}

func (this *Engine[Game]) RegisterUpdate(updater ventities.Updater[Game]) {
	this.updaters.Register(updater)
}

func (this *Engine[Game]) Font() *vtext.Font {
	return this.font
}

func (this *Engine[Game]) Board() *vboards.Board { return this.BoardData }

// to-do: rename to Poll, move props to Engine struct, and don't expose?
func (this *Engine[Game]) Frame() *vgame.Poll { return &this.frame }
func (this *Engine[Game]) Fullscreen() bool   { return this.frame.Fullscreen }
func (this *Engine[Game]) Pointerlock() bool  { return this.frame.Pointerlocked }
func (this *Engine[Game]) NowMillis() float64 { return this.frame.NowMillis }
func (this *Engine[Game]) UtcMillis() uint64  { return this.frame.UtcMillis }
func (this *Engine[Game]) Time() vgame.TimeFormat {
	return this.frame.TimeFormat
}
func (this *Engine[Game]) DeltaMs() float64   { return this.frame.DeltaMillis }
func (this *Engine[Game]) DeltaSecs() float64 { return this.frame.DeltaSecs() }
func (this *Engine[Game]) Tick() *vgame.Tick  { return &this.tick }

func (this *Engine[Game]) RequestFullscreen(fullscreen bool) {
	if fullscreen {
		this.fullscreenRequest = vgame.FullscreenRequestEnter
	} else {
		this.fullscreenRequest = vgame.FullscreenRequestExit
	}
}

func (this *Engine[Game]) FullscreenRequest() int32 {
	request := this.fullscreenRequest
	this.fullscreenRequest = vgame.FullscreenRequestNone
	return int32(request)
}

func (this *Engine[Game]) RequestScreenshot() {
	this.screenshotRequest = true
}

// to-do: just a big flag API?
func (this *Engine[Game]) ScreenshotRequest() int32 {
	if !this.screenshotRequest {
		return 0
	}
	this.screenshotRequest = false
	return 1
}

func (this *Engine[Game]) RequestContextLoss() {
	this.contextLossRequest = true
}

// requests an update after millis. zero cancels the pending request. always
// cleared on next frame. to-do: is this right?
func (this *Engine[Game]) RequestUpdateInMillis(millis uint64) {
	this.updateInMillis = millis
}

// returns and clears the pending update delay.
func (this *Engine[Game]) UpdateInMillisRequest() uint64 {
	millis := this.updateInMillis
	this.updateInMillis = 0
	return millis
}

func (this *Engine[Game]) ContextLossRequest() int32 {
	if !this.contextLossRequest {
		return 0
	}
	this.contextLossRequest = false
	return 1
}

func (this *Engine[Game]) SetDrawAlways(always bool) {
	this.drawAlways = always
}

func (this *Engine[Game]) DrawAlways() bool { return this.drawAlways }

func (this *Engine[Game]) FullscreenDisabled() bool {
	return this.disableFullscreen
}

func (this *Engine[Game]) DisableFullscreen(disable bool) {
	this.disableFullscreen = disable
	this.RequestFullscreen(!disable)
}

func (this *Engine[Game]) WakelockDisabled() bool { return this.disableWakelock }

func (this *Engine[Game]) DisableWakelock(disable bool) {
	this.disableWakelock = disable
}

// reports whether the browser currently holds the requested wakelock.
func (this *Engine[Game]) Wakelock() bool {
	return this.frame.Wakelocked
}

func (this *Engine[Game]) RequestWakelockFlag() int32 {
	if !this.WakelockDisabled() {
		return 1
	}
	return 0
}

func (this *Engine[Game]) RenderMode() vgfx.RenderMode {
	return this.renderMode
}

func (this *Engine[Game]) DrawAlwaysFlag() int32 {
	if this.drawAlways {
		return 1
	}
	return 0
}

func (this *Engine[Game]) RenderModeFlag() int32 {
	return int32(this.renderMode)
}

func (this *Engine[Game]) FramePointer() uintptr {
	return uintptr(unsafe.Pointer(&this.frame))
}

func (this *Engine[Game]) BeepPointer() uintptr {
	return uintptr(unsafe.Pointer(&this.beeps[0]))
}

func (this *Engine[Game]) BeepCount() uint32 { return this.beepCount }

func (this *Engine[Game]) Cam() *vgeo.XY[float32] { return &this.cam }
func (this *Engine[Game]) CamX() float32          { return this.cam.X }
func (this *Engine[Game]) CamY() float32          { return this.cam.Y }

func (this *Engine[Game]) CanvasPhy() *vgeo.WH[uint16] {
	return &this.frame.CanvasPhy
}
func (this *Engine[Game]) In() *vin.In {
	return this.in
}

// returns the cursor's phy hitbox when active, else nil.
func (this *Engine[Game]) CursorPhy() *vgeo.Box[float32] {
	return this.Cursor.HitboxPhy()
}

func (this *Engine[Game]) BoardW() int32 { return this.BoardData.W }
func (this *Engine[Game]) BoardH() int32 { return this.BoardData.H }

func (this *Engine[Game]) LayerConfigsPointer() uintptr {
	return uintptr(unsafe.Pointer(unsafe.SliceData(this.layerConfigExport[:])))
}
func (this *Engine[Game]) Layer(layer vgfx.Layer) *vgfx.LayerConfig {
	return &this.layers[layer]
}

func (this *Engine[Game]) BoardTilesPointer() uintptr {
	if this.BoardData == nil || len(this.BoardData.Tiles) == 0 {
		return 0
	}
	return uintptr(unsafe.Pointer(&this.BoardData.Tiles[0]))
}
func (this *Engine[Game]) BoardTileW() uint8 { return this.BoardData.Tile.W }
func (this *Engine[Game]) BoardTileH() uint8 { return this.BoardData.Tile.H }

func (this *Engine[Game]) EndTick(stat vgame.Status) vgame.Status {
	if this.drawAlways {
		stat |= vgame.Loop
	}
	this.tick.UpdateMs = this.frame.UpdateMillis
	// to-do: make frame finalization explicit instead of hanging this off
	// EndTick.
	this.updateLayerConfigExport()
	return stat
}

func (this *Engine[Game]) Preupdate(gam Game) vgame.Status {
	this.updateLayerScales()
	stat := this.preupdaters.Update(gam)
	this.updateLayerClips()
	return stat
}

func (this *Engine[Game]) Ents() *ventities.Zoo[Game] {
	return &this.updaters
}

func (this *Engine[Game]) AtlasAnimCount() uint32 {
	return uint32(len(this.Atlas.Anims))
}

func (this *Engine[Game]) AtlasCelsPerAnim() uint32 {
	return uint32(vatlas.CelsPerAnim)
}

func (this *Engine[Game]) AtlasCelsPointer() uintptr {
	if len(this.Atlas.Cels) == 0 {
		return 0
	}
	return uintptr(unsafe.Pointer(unsafe.SliceData(this.Atlas.Cels)))
}

func (this *Engine[Game]) AtlasCelsCount() uint32 {
	return uint32(len(this.Atlas.Cels))
}

func (this *Engine[Game]) BeginTick() vgame.Status {
	this.beepCount = 0
	this.in.Update(
		this.frame.NowMillis,
		&this.frame.InputPoll,
		vgeo.Box[float32]{
			Min: this.cam}, // to-do: actual cam box.
	)
	this.tick.DrawCount = this.frame.DrawCount
	this.drawAlways = this.frame.DrawAlways
	if this.frame.RequestWakelock == vgame.WakelockRequestOff {
		this.DisableWakelock(true)
	}
	if this.frame.RequestFullscreen == vgame.FullscreenRequestExit {
		this.DisableFullscreen(true)
	}
	for i := range this.layers {
		this.layers[i].Sprs = this.layers[i].Sprs[:0]
	}
	return vgame.Pause
}

func (this *Engine[Game]) updateLayerScales() {
	for i := range this.layers {
		config := &this.layers[i]
		clip := config.ClipPhy
		clipW := float32(clip.W())
		clipH := float32(clip.H())
		if clipW == 0 || clipH == 0 {
			clipW = float32(this.frame.CanvasPhy.W)
			clipH = float32(this.frame.CanvasPhy.H)
		}
		config.UpdateScale(vgeo.NewWH(clipW, clipH))
	}
}

func (this *Engine[Game]) updateLayerClips() {
	for i := range this.layers {
		config := &this.layers[i]
		config.UpdateCam(this.cam)
		clip := config.ClipPhy
		clipX := float32(clip.Min.X)
		clipY := float32(clip.Min.Y)
		clipW := float32(clip.W())
		clipH := float32(clip.H())
		if clipW == 0 || clipH == 0 {
			clipX = 0
			clipY = 0
			clipW = float32(this.frame.CanvasPhy.W)
			clipH = float32(this.frame.CanvasPhy.H)
		}
		config.UpdateScale(vgeo.NewWH(clipW, clipH))
		minXY := config.PhyToLayer(vgeo.NewXY(clipX, clipY))
		maxXY := config.PhyToLayer(vgeo.NewXY(clipX+clipW, clipY+clipH))
		config.Clip = vgeo.Box[float32]{Min: minXY, Max: maxXY}
	}
}

func (this *Engine[Game]) updateLayerConfigExport() {
	for i := range this.layers {
		layer := &this.layers[i]
		sprs := layer.Sprs
		sprsPtr := uint32(0)
		if len(sprs) != 0 {
			sprsPtr = uint32(uintptr(unsafe.Pointer(unsafe.SliceData(sprs))))
		}
		flags := (uint8(layer.BlendMode) & vgfx.LayerFlagsBlendModeMask) <<
			vgfx.LayerFlagsBlendModeShift
		if layer.Depth {
			flags |= vgfx.LayerFlagsDepthFlag << vgfx.LayerFlagsDepthShift
		}
		this.layerConfigExport[i] = vgfx.LayerConfigExport{
			CamMode:  layer.CamMode,
			Shader:   layer.Shader,
			Flags:    flags,
			ClipXPhy: layer.ClipPhy.Min.X,
			ClipYPhy: layer.ClipPhy.Min.Y,
			ClipWPhy: layer.ClipPhy.W(),
			ClipHPhy: layer.ClipPhy.H(),
			Scale:    layer.ScaleOrDefault(),
			SprsPtr:  sprsPtr,
			SprCount: uint32(len(sprs)),
		}
	}
}
