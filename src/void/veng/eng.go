// ╭>°╮┬┌─╮╭─╮┬┌─╮
// ╰──╰┴╯─╯╰─╰┴╯─╯
package veng

import (
	"unsafe"

	"math/rand/v2"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
	"github.com/oidoid/void/src/void/vmem/vvec"
	"github.com/oidoid/void/src/void/vtext"
)

type Eng struct {
	atlas  vatlas.Atlas
	board  *vboards.Board
	cursor *CursorEnt
	font   *vtext.Font
	out    Out
	in     *vin.In
	layers [vgfx.LayerCount]vgfx.LayerConfig
	poll   Poll
	rnd    *rand.Rand
	texts  vvec.Vec[TextEnt]
	tick   Tick
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

func NewEng(opts *EngOpts) *Eng {
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
	this := &Eng{
		font:  opts.Font,
		atlas: opts.Atlas,
		board: opts.Board,
		in:    vin.NewIn(),
		rnd:   rand.New(rand.NewPCG(opts.Seed1, opts.Seed2)),
		out: Out{
			RenderMode: opts.RenderMode,
			DrawOnBlur: opts.DrawOnBlur,
		},
	}
	for i := range this.layers {
		this.layers[i] = vgfx.NewLayerConfig(opts.MaxSprs)
	}

	return this
}

func (this *Eng) Random() float32 { return this.rnd.Float32() }

func (this *Eng) Beep(beep Beep) {
	if this.out.BeepCount == uint32(len(this.out.Beeps)) {
		return
	}
	this.out.Beeps[this.out.BeepCount] = beep
	this.out.BeepCount++
}

func (this *Eng) Font() *vtext.Font {
	return this.font
}

func (this *Eng) Atlas() *vatlas.Atlas { return &this.atlas }

func (this *Eng) Texts() *vvec.Vec[TextEnt] {
	return &this.texts
}

func (this *Eng) Cursor() *CursorEnt { return this.cursor }

func (this *Eng) SetCursor(cursor *CursorEnt) {
	this.cursor = cursor
}

func (this *Eng) Board() *vboards.Board { return this.board }

func (this *Eng) SetBoard(board *vboards.Board) bool {
	if this.board == board || this.board != nil && board != nil &&
		this.board.Level == board.Level {
		return false
	}
	this.board = board
	return true
}

// to-do: rename to Poll, move props to Engine struct, and don't expose?
func (this *Eng) Poll() *Poll        { return &this.poll }
func (this *Eng) Fullscreen() bool   { return this.poll.Fullscreen }
func (this *Eng) Ptrlock() bool      { return this.poll.Ptrlocked }
func (this *Eng) NowMillis() float64 { return this.poll.NowMillis }
func (this *Eng) UtcMillis() uint64  { return this.poll.UtcMillis }
func (this *Eng) Time() TimeFormat {
	return this.poll.TimeFormat
}
func (this *Eng) DeltaMs() float64   { return this.poll.DeltaMillis }
func (this *Eng) DeltaSecs() float64 { return this.poll.DeltaSecs() }
func (this *Eng) Tick() *Tick        { return &this.tick }

func (this *Eng) ReqFullscreen(req FullscreenReq) {
	this.out.FullscreenReq = req
}

func (this *Eng) FullscreenReq() int32 {
	return int32(this.out.FullscreenReq)
}

func (this *Eng) ReqScreenshot() {
	this.out.Requests |= OutReqMask << OutReqScreenshotShift
}

func (this *Eng) ReqContextLoss() {
	this.out.Requests |= OutReqMask << OutReqContextLossShift
}

// reqs an update after millis. zero cancels the req. reset by BeginTick().
func (this *Eng) ReqUpdateInMillis(millis uint64) {
	this.out.UpdateInMillis = millis
}

func (this *Eng) SetDrawAlways(always bool) {
	this.out.DrawAlways = always
}

func (this *Eng) DrawAlways() bool { return this.out.DrawAlways }

// allow normal updates and drawing while unfocused.
func (this *Eng) SetDrawOnBlur(on bool) { this.out.DrawOnBlur = on }

func (this *Eng) DrawOnBlur() bool { return this.out.DrawOnBlur }

func (this *Eng) FullscreenEnabled() bool {
	return this.out.FullscreenReq == FullscreenReqEnter ||
		this.out.FullscreenReq == FullscreenReqPortrait ||
		this.out.FullscreenReq == FullscreenReqLandscape
}

func (this *Eng) RenderMode() vgfx.RenderMode {
	return this.out.RenderMode
}

func (this *Eng) PollPtr() uintptr {
	return uintptr(unsafe.Pointer(&this.poll))
}

func (this *Eng) OutPtr() uintptr {
	this.updateOut()
	return uintptr(unsafe.Pointer(&this.out))
}

func (this *Eng) BeepCount() uint32 { return this.out.BeepCount }

func (this *Eng) Cam() *vgeo.XY[float32] { return &this.out.Cam }

func (this *Eng) CanvasPhy() *vgeo.WH[uint16] {
	return &this.poll.CanvasPhy
}
func (this *Eng) In() *vin.In {
	return this.in
}

func (this *Eng) BoardLevel() uint16 {
	if this.board == nil {
		return 0
	}
	return uint16(this.board.Level)
}

func (this *Eng) BoardW() int32 {
	if this.board == nil {
		return 0
	}
	return this.board.W
}

func (this *Eng) BoardH() int32 {
	if this.board == nil {
		return 0
	}
	return this.board.H
}

func (this *Eng) BoardTilesLen() uint32 {
	if this.board == nil {
		return 0
	}
	return uint32(len(this.board.Tiles))
}

func (this *Eng) Layer(layer vgfx.Layer) *vgfx.LayerConfig {
	return &this.layers[layer]
}

func (this *Eng) BoardTileW() uint8 {
	if this.board == nil {
		return 0
	}
	return this.board.Tile.W
}

func (this *Eng) BoardTileH() uint8 {
	if this.board == nil {
		return 0
	}
	return this.board.Tile.H
}

func (this *Eng) EndTick(stat Status) Status {
	stat |= this.updateTexts()
	if this.out.DrawAlways {
		stat |= Loop
	}
	this.tick.UpdateMs = this.poll.UpdateMillis
	// to-do: make frame finalization explicit instead of hanging this off
	// EndTick.
	this.updateOut()
	return stat
}

func (this *Eng) updateTexts() Status {
	ents := this.texts.Vals()
	stat := Pause
	for i := range ents {
		ent := &ents[i]
		layer := &this.layers[ent.Z.Layer()]
		stat |= ent.Update(this.font, &layer.Sprs, layer.Clip)
	}
	return stat
}

func (this *Eng) BeginTick() Status {
	this.out.Requests = 0
	this.out.UpdateInMillis = 0
	this.out.BeepCount = 0
	this.in.Update(
		this.poll.NowMillis,
		&this.poll.InPoll,
		vgeo.Box[float32]{
			Min: this.out.Cam}, // to-do: actual cam box.
	)
	this.tick.DrawCount = this.poll.DrawCount
	this.out.DrawAlways = this.poll.DrawAlways
	req := this.poll.FullscreenReq
	if req != FullscreenReqNone {
		this.ReqFullscreen(req)
	}
	for i := range this.layers {
		this.layers[i].Sprs = this.layers[i].Sprs[:0]
	}
	return Pause
}

func (this *Eng) updateOut() {
	out := &this.out
	out.BoardLevel = this.BoardLevel()
	out.BoardW, out.BoardH = this.BoardW(), this.BoardH()
	out.BoardTileW, out.BoardTileH = this.BoardTileW(), this.BoardTileH()
	out.BoardTilesPtr, out.BoardTilesLen = 0, 0
	if this.board != nil {
		out.BoardTilesLen = uint32(len(this.board.Tiles))
		if out.BoardTilesLen != 0 {
			out.BoardTilesPtr = uint32(uintptr(
				unsafe.Pointer(unsafe.SliceData(this.board.Tiles)),
			))
		}
	}
	out.AtlasMetaCount = uint32(len(this.atlas.Meta))
	out.AtlasMetaPtr = uint32(uintptr(
		unsafe.Pointer(unsafe.SliceData(this.atlas.Meta)),
	))
	out.AtlasCelsCount = uint32(len(this.atlas.Cels))
	out.AtlasCelsPtr = 0
	if out.AtlasCelsCount != 0 {
		out.AtlasCelsPtr = uint32(uintptr(
			unsafe.Pointer(unsafe.SliceData(this.atlas.Cels)),
		))
	}
	this.updateLayerConfigExport()
}

func (this *Eng) updateLayerScales() {
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

func (this *Eng) updateLayerClips() {
	for i := range this.layers {
		config := &this.layers[i]
		config.UpdateCam(this.out.Cam)
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

func (this *Eng) updateLayerConfigExport() {
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
		this.out.Layers[i] = vgfx.LayerConfigExport{
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
