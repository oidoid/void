// ╭>°╮┬┌─╮╭─╮┬┌─╮
// ╰──╰┴╯─╯╰─╰┴╯─╯
package vengine

import (
	"unsafe"

	"math/rand/v2"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
	"github.com/oidoid/void/src/void/vtext"
)

type Eng[App Game] struct {
	atlas             vatlas.Atlas
	beepCount         uint32
	beeps             [16]Beep
	board             *vboards.Board
	cam               vgeo.XY[float32] // to-do: cam always moves in physical space.
	contextLossReq    bool
	cursor            *ventities.CursorEnt
	drawAlways        bool
	drawOnBlur        bool
	font              *vtext.Font
	fullscreenReq     FullscreenReq
	in                *vin.In
	layerConfigExport [vgfx.LayerCount]vgfx.LayerConfigExport
	layers            [vgfx.LayerCount]vgfx.LayerConfig
	poll              Poll
	preupdaters       ventities.Zoo[App]
	renderMode        vgfx.RenderMode
	rnd               *rand.Rand
	router            Router[App]
	screenshotReq     bool
	texts             ventities.EntVec[App, ventities.TextEnt]
	tick              Tick
	updateInMillis    uint64
	updaters          ventities.Zoo[App]
}

type EngOpts struct {
	Atlas      vatlas.Atlas
	Board      *vboards.Board
	DrawOnBlur bool // allows updates and drawing without focus; defaults off.
	Font       *vtext.Font
	MaxSprs    int
	RenderMode vgfx.RenderMode
	Seed1      uint64
	Seed2      uint64
}

func New[App Game](opts *EngOpts) *Eng[App] {
	if opts == nil {
		opts = &EngOpts{}
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
	this := &Eng[App]{
		font:       opts.Font,
		atlas:      opts.Atlas,
		board:      opts.Board,
		in:         vin.NewIn(),
		rnd:        rand.New(rand.NewPCG(opts.Seed1, opts.Seed2)),
		renderMode: opts.RenderMode,
		drawOnBlur: opts.DrawOnBlur,
	}
	for i := range this.layers {
		this.layers[i] = vgfx.NewLayerConfig(opts.MaxSprs)
	}

	return this
}

func (this *Eng[Game]) Random() float32 { return this.rnd.Float32() }

func (this *Eng[Game]) Beep(beep Beep) {
	if this.beepCount == uint32(len(this.beeps)) {
		return
	}
	this.beeps[this.beepCount] = beep
	this.beepCount++
}

func (this *Eng[Game]) RegisterPreupdate(fn func(Game) Status) {
	this.preupdaters.Register(ventities.UpdaterFunc[Game](fn))
}

func (this *Eng[Game]) RegisterUpdate(updater ventities.Updater[Game]) {
	this.updaters.Register(updater)
}

func (this *Eng[Game]) Font() *vtext.Font {
	return this.font
}

func (this *Eng[Game]) Router() *Router[Game] { return &this.router }

func (this *Eng[Game]) Atlas() *vatlas.Atlas { return &this.atlas }

func (this *Eng[Game]) Texts() *ventities.EntVec[Game, ventities.TextEnt] {
	return &this.texts
}

func (this *Eng[Game]) Cursor() *ventities.CursorEnt { return this.cursor }

func (this *Eng[Game]) SetCursor(cursor *ventities.CursorEnt) {
	this.cursor = cursor
}

func (this *Eng[Game]) Board() *vboards.Board { return this.board }

func (this *Eng[Game]) SetBoard(board *vboards.Board) { this.board = board }

// to-do: rename to Poll, move props to Engine struct, and don't expose?
func (this *Eng[Game]) Poll() *Poll        { return &this.poll }
func (this *Eng[Game]) Fullscreen() bool   { return this.poll.Fullscreen }
func (this *Eng[Game]) Ptrlock() bool      { return this.poll.Ptrlocked }
func (this *Eng[Game]) NowMillis() float64 { return this.poll.NowMillis }
func (this *Eng[Game]) UtcMillis() uint64  { return this.poll.UtcMillis }
func (this *Eng[Game]) Time() TimeFormat {
	return this.poll.TimeFormat
}
func (this *Eng[Game]) DeltaMs() float64   { return this.poll.DeltaMillis }
func (this *Eng[Game]) DeltaSecs() float64 { return this.poll.DeltaSecs() }
func (this *Eng[Game]) Tick() *Tick        { return &this.tick }

func (this *Eng[Game]) ReqFullscreen(req FullscreenReq) {
	this.fullscreenReq = req
}

func (this *Eng[Game]) FullscreenReq() int32 {
	return int32(this.fullscreenReq)
}

func (this *Eng[Game]) ReqScreenshot() {
	this.screenshotReq = true
}

// to-do: just a big flag API?
func (this *Eng[Game]) ScreenshotReq() int32 {
	if !this.screenshotReq {
		return 0
	}
	this.screenshotReq = false
	return 1
}

func (this *Eng[Game]) ReqContextLoss() {
	this.contextLossReq = true
}

// reqs an update after millis. zero cancels the pending req. always
// cleared on next frame. to-do: is this right?
func (this *Eng[Game]) ReqUpdateInMillis(millis uint64) {
	this.updateInMillis = millis
}

// returns and clears the pending update delay.
func (this *Eng[Game]) UpdateInMillisReq() uint64 {
	millis := this.updateInMillis
	this.updateInMillis = 0
	return millis
}

func (this *Eng[Game]) ContextLossReq() int32 {
	if !this.contextLossReq {
		return 0
	}
	this.contextLossReq = false
	return 1
}

func (this *Eng[Game]) SetDrawAlways(always bool) {
	this.drawAlways = always
}

func (this *Eng[Game]) DrawAlways() bool { return this.drawAlways }

// allow normal updates and drawing while unfocused.
func (this *Eng[Game]) SetDrawOnBlur(on bool) { this.drawOnBlur = on }

func (this *Eng[Game]) DrawOnBlur() bool { return this.drawOnBlur }

func (this *Eng[Game]) DrawOnBlurFlag() int32 {
	if this.drawOnBlur {
		return 1
	}
	return 0
}

func (this *Eng[Game]) FullscreenEnabled() bool {
	return this.fullscreenReq == FullscreenReqEnter ||
		this.fullscreenReq == FullscreenReqPortrait ||
		this.fullscreenReq == FullscreenReqLandscape
}

func (this *Eng[Game]) RenderMode() vgfx.RenderMode {
	return this.renderMode
}

func (this *Eng[Game]) DrawAlwaysFlag() int32 {
	if this.drawAlways {
		return 1
	}
	return 0
}

func (this *Eng[Game]) RenderModeFlag() int32 {
	return int32(this.renderMode)
}

func (this *Eng[Game]) PollPtr() uintptr {
	return uintptr(unsafe.Pointer(&this.poll))
}

func (this *Eng[Game]) BeepPtr() uintptr {
	return uintptr(unsafe.Pointer(&this.beeps[0]))
}

func (this *Eng[Game]) BeepCount() uint32 { return this.beepCount }

func (this *Eng[Game]) Cam() *vgeo.XY[float32] { return &this.cam }
func (this *Eng[Game]) CamX() float32          { return this.cam.X }
func (this *Eng[Game]) CamY() float32          { return this.cam.Y }

func (this *Eng[Game]) CanvasPhy() *vgeo.WH[uint16] {
	return &this.poll.CanvasPhy
}
func (this *Eng[Game]) In() *vin.In {
	return this.in
}

func (this *Eng[Game]) BoardW() int32 { return this.board.W }
func (this *Eng[Game]) BoardH() int32 { return this.board.H }

func (this *Eng[Game]) LayerConfigsPtr() uintptr {
	return uintptr(unsafe.Pointer(unsafe.SliceData(this.layerConfigExport[:])))
}
func (this *Eng[Game]) Layer(layer vgfx.Layer) *vgfx.LayerConfig {
	return &this.layers[layer]
}

func (this *Eng[Game]) BoardTilesPtr() uintptr {
	if this.board == nil || len(this.board.Tiles) == 0 {
		return 0
	}
	return uintptr(unsafe.Pointer(&this.board.Tiles[0]))
}
func (this *Eng[Game]) BoardTileW() uint8 { return this.board.Tile.W }
func (this *Eng[Game]) BoardTileH() uint8 { return this.board.Tile.H }

func (this *Eng[Game]) EndTick(stat Status) Status {
	if this.drawAlways {
		stat |= Loop
	}
	this.tick.UpdateMs = this.poll.UpdateMillis
	// to-do: make frame finalization explicit instead of hanging this off
	// EndTick.
	this.updateLayerConfigExport()
	return stat
}

func (this *Eng[Game]) Preupdate(gam Game) Status {
	this.updateLayerScales()
	stat := this.preupdaters.Update(gam)
	this.updateLayerClips()
	return stat
}

func (this *Eng[Game]) Ents() *ventities.Zoo[Game] {
	return &this.updaters
}

func (this *Eng[Game]) AtlasAnimCount() uint32 {
	return uint32(len(this.atlas.Anims))
}

func (this *Eng[Game]) AtlasCelsPerAnim() uint32 {
	return uint32(vatlas.CelsPerAnim)
}

func (this *Eng[Game]) AtlasCelsPtr() uintptr {
	if len(this.atlas.Cels) == 0 {
		return 0
	}
	return uintptr(unsafe.Pointer(unsafe.SliceData(this.atlas.Cels)))
}

func (this *Eng[Game]) AtlasCelsCount() uint32 {
	return uint32(len(this.atlas.Cels))
}

func (this *Eng[Game]) BeginTick() Status {
	this.beepCount = 0
	this.in.Update(
		this.poll.NowMillis,
		&this.poll.InPoll,
		vgeo.Box[float32]{
			Min: this.cam}, // to-do: actual cam box.
	)
	this.tick.DrawCount = this.poll.DrawCount
	this.drawAlways = this.poll.DrawAlways
	req := this.poll.FullscreenReq
	this.poll.FullscreenReq = FullscreenReqNone
	if req != FullscreenReqNone {
		this.ReqFullscreen(req)
	}
	for i := range this.layers {
		this.layers[i].Sprs = this.layers[i].Sprs[:0]
	}
	return Pause
}

func (this *Eng[Game]) updateLayerScales() {
	for i := range this.layers {
		config := &this.layers[i]
		clip := config.ClipPhy
		clipW := float32(clip.W())
		clipH := float32(clip.H())
		if clipW == 0 || clipH == 0 {
			clipW = float32(this.poll.CanvasPhy.W)
			clipH = float32(this.poll.CanvasPhy.H)
		}
		config.UpdateScale(vgeo.NewWH(clipW, clipH))
	}
}

func (this *Eng[Game]) updateLayerClips() {
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
			clipW = float32(this.poll.CanvasPhy.W)
			clipH = float32(this.poll.CanvasPhy.H)
		}
		config.UpdateScale(vgeo.NewWH(clipW, clipH))
		minXY := config.PhyToLayer(vgeo.NewXY(clipX, clipY))
		maxXY := config.PhyToLayer(vgeo.NewXY(clipX+clipW, clipY+clipH))
		config.Clip = vgeo.Box[float32]{Min: minXY, Max: maxXY}
	}
}

func (this *Eng[Game]) updateLayerConfigExport() {
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
