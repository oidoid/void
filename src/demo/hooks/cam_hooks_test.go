package hooks

import (
	"testing"

	"github.com/oidoid/void/src/demo/engine"
	"github.com/oidoid/void/src/demo/gfx"
	"github.com/oidoid/void/src/void/ventities"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
)

func camKeyStepMillis() float64 {
	return 1000 / float64(camKeyVel)
}

func TestPinchZoom(t *testing.T) {
	tests := []struct {
		name  string
		pinch vin.Pinch
		want  float32
	}{
		{
			name:  "start",
			pinch: vin.Pinch{SpanPhy: vgeo.NewXY[float32](2, 0)},
			want:  1,
		},
		{
			name: "double",
			pinch: vin.Pinch{
				SpanPhy:  vgeo.NewXY[float32](4, 0),
				DeltaPhy: vgeo.NewXY[float32](2, 0),
			},
			want: 2,
		},
		{
			name: "diagonal double",
			pinch: vin.Pinch{
				SpanPhy:  vgeo.NewXY[float32](6, 8),
				DeltaPhy: vgeo.NewXY[float32](3, 4),
			},
			want: 2,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := pinchZoom(&test.pinch); got != test.want {
				t.Errorf("pinchZoom() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestWheelZoom(t *testing.T) {
	tests := []struct {
		delta float32
		want  float32
	}{
		{delta: -100, want: 1.25},
		{delta: 0, want: 1},
		{delta: 100, want: .8},
	}
	for _, test := range tests {
		if got := wheelZoom(test.delta); got != test.want {
			t.Errorf("wheelZoom(%v) = %v, want %v", test.delta, got, test.want)
		}
	}
}

func TestKeyZoom(t *testing.T) {
	if keyZoomDelta != .25 {
		t.Errorf("keyZoomDelta = %v, want .25", keyZoomDelta)
	}
}

func TestKeyZoomTarget(t *testing.T) {
	tests := []struct {
		name      string
		scale, by float32
		want      float32
	}{
		{name: "aligned in", scale: 3.25, by: .25, want: 3.5},
		{name: "unaligned in", scale: 3.2, by: .25, want: 3.25},
		{name: "aligned out", scale: 3.25, by: -.25, want: 3},
		{name: "unaligned out", scale: 3.2, by: -.25, want: 3},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := keyZoomTarget(test.scale, test.by); got != test.want {
				t.Errorf("keyZoomTarget(%v, %v) = %v, want %v",
					test.scale, test.by, got, test.want)
			}
		})
	}
}

func TestUpdateCamZoomEndSnapsNearInteger(t *testing.T) {
	tests := []struct {
		name        string
		scale, want float32
	}{
		{name: "below", scale: 3.9, want: 4},
		{name: "above", scale: 4.1, want: 4},
		{name: "outside", scale: 4.11, want: 4.11},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gam := engine.New()
			gam.CanvasPhy().W = 1024
			gam.CanvasPhy().H = 640
			gam.LvlZoom = test.scale
			gam.UpdateLvlLayers()
			gam.CamZoomOn = true
			gam.CamZoomAnchorPhy = vgeo.NewXY[float32](256, 160)
			UpdateCam(gam)
			if got := gam.Layer(gfx.LayerTiles).ScaleOrDefault(); got != test.want {
				t.Errorf("scale = %v, want %v", got, test.want)
			}
		})
	}
}

func TestLvlEdge(t *testing.T) {
	tests := []struct {
		name      string
		canvasPhy vgeo.WH[uint16]
		clipPhy   vgeo.Box[uint16]
		scale     float32
		wantEdge  vgeo.Box[float32]
	}{
		{
			name:      "float clip resolution",
			canvasPhy: vgeo.NewWH[uint16](2018, 1250),
			clipPhy:   vgeo.XYWH[uint16](241, 145, 1536, 960),
			scale:     3,
			wantEdge:  vgeo.NewBox[float32](80, 48, 593, 369),
		},
		{
			name:      "exact clip resolution",
			canvasPhy: vgeo.NewWH[uint16](2000, 1200),
			clipPhy:   vgeo.XYWH[uint16](240, 160, 1520, 880),
			scale:     4,
			wantEdge:  vgeo.NewBox[float32](60, 40, 440, 260),
		},
		{
			name:      "float scale with float clip width",
			canvasPhy: vgeo.NewWH[uint16](2018, 1250),
			clipPhy:   vgeo.XYWH[uint16](241, 145, 1536, 960),
			scale:     2.5,
			wantEdge:  vgeo.NewBox[float32](96, 58, 712, 442),
		},
		{
			name:      "float scale with float clip axes",
			canvasPhy: vgeo.NewWH[uint16](2018, 1250),
			clipPhy:   vgeo.XYWH[uint16](241, 145, 1536, 960),
			scale:     1.5,
			wantEdge:  vgeo.NewBox[float32](160, 96, 1186, 738),
		},
		{
			name:      "full canvas edges",
			canvasPhy: vgeo.NewWH[uint16](2018, 1250),
			clipPhy:   vgeo.XYWH[uint16](0, 0, 2018, 1250),
			scale:     3,
			wantEdge:  vgeo.NewBox[float32](0, 0, 673, 417),
		},
		{
			name:      "default scale",
			canvasPhy: vgeo.NewWH[uint16](200, 120),
			clipPhy:   vgeo.XYWH[uint16](20, 20, 160, 80),
			wantEdge:  vgeo.NewBox[float32](20, 20, 180, 100),
		},
		{
			name:      "float clip width only",
			canvasPhy: vgeo.NewWH[uint16](2018, 1200),
			clipPhy:   vgeo.XYWH[uint16](241, 180, 1536, 840),
			scale:     3,
			wantEdge:  vgeo.NewBox[float32](80, 60, 593, 340),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ui := vgfx.LayerConfig{Scale: test.scale}
			edge := lvlEdge(test.clipPhy, test.canvasPhy, &ui)
			if got := edge; got != test.wantEdge {
				t.Fatalf("lvlEdge() = %v, want %v", got, test.wantEdge)
			}
		})
	}
}

// keeps diagonal key motion synchronized on both whole lvl-px axes.
func TestUpdateCamDiagonal(t *testing.T) {
	gam := engine.New()
	*gam.Cam() = vgeo.XY[float32]{}
	gam.Layer(gfx.LayerTiles).Scale = 4
	gam.Frame().DeltaMillis = camKeyStepMillis()
	in := gam.In()
	in.Dir = vgeo.NewXY[int8](1, 1)
	in.DirOn = true
	in.On = vin.ButtonR | vin.ButtonD
	UpdateCam(gam)
	if got := *gam.Cam(); got != vgeo.NewXY[float32](4, 4) {
		t.Errorf("first diagonal cam = %v, want (4,4)", got)
	}
	in.PrevDir = in.Dir
	in.PrevOn = in.On
	in.Mask = 0
	UpdateCam(gam)
	if got := *gam.Cam(); got != vgeo.NewXY[float32](8, 8) {
		t.Errorf("second diagonal cam = %v, want (8,8)", got)
	}
}

// keeps key velocity constant in lvl px across camera scales.
func TestUpdateCamKeyVel(t *testing.T) {
	for _, scale := range []float32{4, 80} {
		gam := engine.New()
		*gam.Cam() = vgeo.XY[float32]{}
		tiles := gam.Layer(gfx.LayerTiles)
		tiles.Scale = scale
		gam.Frame().DeltaMillis = camKeyStepMillis()
		in := gam.In()
		in.Dir = vgeo.NewXY[int8](1, 0)
		in.DirOn = true
		in.On = vin.ButtonR
		UpdateCam(gam)
		if got := tiles.PhyToLayerScale(*gam.Cam()); got != vgeo.NewXY[float32](1, 0) {
			t.Errorf("scale %v key cam = %v, want (1,0)", scale, got)
		}
	}
}

// keeps directional input out of the camera while keyboard cursor mode is on.
func TestUpdateCamCursorKeyMode(t *testing.T) {
	gam := engine.New()
	*gam.Cam() = vgeo.XY[float32]{}
	gam.Layer(gfx.LayerTiles).Scale = 4
	gam.Frame().DeltaMillis = camKeyStepMillis()
	in := gam.In()
	in.Dir = vgeo.NewXY[int8](1, 0)
	in.DirOn = true
	in.On = vin.ButtonR
	gam.Cursor = &ventities.CursorEnt{KbdEnabled: true}
	UpdateCam(gam)
	if got := *gam.Cam(); got != (vgeo.XY[float32]{}) {
		t.Errorf("keyboard cursor cam = %v, want zero", got)
	}
	gam.Cursor.KbdEnabled = false
	UpdateCam(gam)
	if got := gam.Cam().X; got != 4 {
		t.Errorf("camera after keyboard cursor mode X = %v, want 4", got)
	}
}

// limits a multi-key direction transition to one lvl-px step per axis.
func TestUpdateCamDirChange(t *testing.T) {
	gam := engine.New()
	*gam.Cam() = vgeo.XY[float32]{}
	gam.Layer(gfx.LayerTiles).Scale = 4
	gam.Frame().DeltaMillis = camKeyStepMillis()
	in := gam.In()
	update := func(dir vgeo.XY[int8], prevOn, on vin.Button) {
		in.PrevDir = in.Dir
		in.Dir = dir
		in.DirOn = dir != (vgeo.XY[int8]{})
		in.PrevOn = prevOn
		in.On = on
		in.Mask = 0
		UpdateCam(gam)
	}
	for i := range 12 {
		prevOn := vin.ButtonR
		if i == 0 {
			prevOn = 0
		}
		update(vgeo.NewXY[int8](1, 0), prevOn, vin.ButtonR)
	}
	for i := range 12 {
		prevOn := vin.ButtonR | vin.ButtonD
		if i == 0 {
			prevOn = vin.ButtonR
		}
		update(vgeo.NewXY[int8](1, 1), prevOn, vin.ButtonR|vin.ButtonD)
	}
	for i := range 12 {
		prevOn := vin.ButtonR | vin.ButtonD | vin.ButtonL
		if i == 0 {
			prevOn = vin.ButtonR | vin.ButtonD
		}
		update(vgeo.NewXY[int8](0, 1), prevOn, vin.ButtonR|vin.ButtonD|vin.ButtonL)
	}
	before := *gam.Cam()
	update(
		vgeo.NewXY[int8](-1, 1),
		vin.ButtonR|vin.ButtonD|vin.ButtonL,
		vin.ButtonD|vin.ButtonL,
	)
	if got := *gam.Cam(); got != vgeo.NewXY[float32](92, 100) {
		t.Errorf("released right cam = %v, want (92,100)", got)
	}
	if dx, dy := gam.Cam().X-before.X, gam.Cam().Y-before.Y; dx < -4 || dx > 4 || dy < -4 || dy > 4 {
		t.Errorf("released right cam delta = (%v,%v), want at most one layer pixel", dx, dy)
	}
}

// prevents cancelled directional progress from moving the opposite way on release.
func TestUpdateCamOpposingKeysReleaseKeepsCam(t *testing.T) {
	tests := []struct {
		name     string
		releases []vin.Button
	}{
		{name: "right then up", releases: []vin.Button{vin.ButtonU, 0}},
		{name: "up then right", releases: []vin.Button{vin.ButtonR, 0}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gam := engine.New()
			*gam.Cam() = vgeo.XY[float32]{}
			gam.Layer(gfx.LayerTiles).Scale = 4
			gam.Frame().DeltaMillis = 1000.0 / 60
			in := gam.In()
			update := func(on vin.Button) {
				dir := vgeo.XY[int8]{}
				if on&vin.ButtonR != 0 {
					dir.X++
				}
				if on&vin.ButtonL != 0 {
					dir.X--
				}
				if on&vin.ButtonD != 0 {
					dir.Y++
				}
				if on&vin.ButtonU != 0 {
					dir.Y--
				}
				in.PrevOn = in.On
				in.PrevDir = in.Dir
				in.On = on
				in.Dir = dir
				in.DirOn = in.Dir != (vgeo.XY[int8]{})
				in.Mask = 0
				UpdateCam(gam)
			}
			hold := func(on vin.Button) {
				for range 180 {
					update(on)
				}
			}

			hold(vin.ButtonL)
			hold(vin.ButtonL | vin.ButtonU)
			hold(vin.ButtonL | vin.ButtonU | vin.ButtonR)
			hold(vin.ButtonU | vin.ButtonR)
			for _, on := range test.releases {
				before := *gam.Cam()
				update(on)
				got := *gam.Cam()
				if on == vin.ButtonU || on == 0 {
					if got.X != before.X {
						t.Errorf("released cam X = %v, want %v", got.X, before.X)
					}
				} else if got.X < before.X {
					t.Errorf("released cam X = %v, moved left from %v", got.X, before.X)
				}
			}
		})
	}
}

// keeps rapid cardinal and diagonal transitions from accelerating either axis.
func TestUpdateCamRapidDirChange(t *testing.T) {
	newGam := func(scale float32) *engine.Eng {
		gam := engine.New()
		*gam.Cam() = vgeo.XY[float32]{}
		gam.Layer(gfx.LayerTiles).Scale = scale
		gam.Frame().DeltaMillis = camKeyStepMillis()
		return gam
	}
	update := func(gam *engine.Eng, dir vgeo.XY[int8], on vin.Button) {
		in := gam.In()
		in.PrevOn = in.On
		in.PrevDir = in.Dir
		in.On = on
		in.Dir = dir
		in.DirOn = true
		in.Mask = 0
		UpdateCam(gam)
	}
	up := vgeo.NewXY[int8](0, -1)
	upRight := vgeo.NewXY[int8](1, -1)
	tests := []struct {
		name   string
		scale  float32
		frames int
		wantY  float32
	}{
		{name: "normal zoom", scale: 4, frames: 4, wantY: -16},
		{name: "deep zoom", scale: 80, frames: 4, wantY: -320},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			held := newGam(test.scale)
			for range test.frames {
				update(held, upRight, vin.ButtonU|vin.ButtonR)
			}
			changed := newGam(test.scale)
			for i := range test.frames {
				if i%2 == 0 {
					update(changed, up, vin.ButtonU)
				} else {
					update(changed, upRight, vin.ButtonU|vin.ButtonR)
				}
			}
			if got := held.Cam().Y; got != test.wantY {
				t.Errorf("held diagonal cam Y = %v, want %v", got, test.wantY)
			}
			if got := changed.Cam().Y; got != held.Cam().Y {
				t.Errorf("changed diagonal cam Y = %v, want %v", got, held.Cam().Y)
			}
		})
	}
}

// resumes key movement from the panned camera, not the prior key accumulator.
func TestUpdateCamKeyPans(t *testing.T) {
	gam := engine.New()
	*gam.Cam() = vgeo.XY[float32]{}
	gam.Layer(gfx.LayerTiles).Scale = 4
	gam.Frame().DeltaMillis = camKeyStepMillis()
	in := gam.In()
	in.Dir = vgeo.NewXY[int8](1, 0)
	in.DirOn = true
	in.On = vin.ButtonR
	UpdateCam(gam)
	in.PrevDir = in.Dir
	in.Ptr = &vin.Pointer{
		Drag: vin.Drag{On: true, DeltaPhy: vgeo.NewXY[float32](-6.5, 0)},
	}
	UpdateCam(gam)
	in.PrevDir = in.Dir
	in.Ptr = &vin.Pointer{Drag: vin.Drag{End: true}}
	UpdateCam(gam)
	if got := gam.Cam().X; got != 16 {
		t.Errorf("key cam X after pan = %v, want 16", got)
	}
}

// discards a pre-zoom key position before applying held-key movement.
func TestUpdateCamKeyZooms(t *testing.T) {
	newGam := func() *engine.Eng {
		gam := engine.New()
		gam.CanvasPhy().W = 1024
		gam.CanvasPhy().H = 640
		*gam.Cam() = vgeo.NewXY[float32](100, 40)
		gam.UpdateLvlLayers()
		in := gam.In()
		in.Dir = vgeo.NewXY[int8](1, 0)
		in.DirOn = true
		in.On = vin.ButtonR
		in.Wheel.Delta.Y = -100
		return gam
	}
	control := newGam()
	UpdateCam(control)
	stale := newGam()
	stale.CamKeyPhy = vgeo.NewXY[float32](-1000, -1000)
	UpdateCam(stale)
	if got := *stale.Cam(); got != *control.Cam() {
		t.Errorf("key cam after zoom = %v, want %v", got, *control.Cam())
	}
}

// accumulates partial key movement without an initial or reversal snap jump.
func TestUpdateCamKeySnap(t *testing.T) {
	gam := engine.New()
	*gam.Cam() = vgeo.XY[float32]{}
	gam.Layer(gfx.LayerTiles).Scale = 4
	gam.Frame().DeltaMillis = 10
	in := gam.In()
	in.Dir = vgeo.NewXY[int8](1, 0)
	in.DirOn = true
	in.On = vin.ButtonR
	UpdateCam(gam)
	if got := gam.Cam().X; got != 0 {
		t.Errorf("first key cam X = %v, want 0", got)
	}
	gam.Frame().DeltaMillis = camKeyStepMillis()
	in.PrevDir = in.Dir
	UpdateCam(gam)
	if got := gam.Cam().X; got != 4 {
		t.Errorf("accumulated key cam X = %v, want 4", got)
	}
	in.PrevDir = in.Dir
	in.Dir.X = -1
	in.On = vin.ButtonL
	in.Mask = 0
	UpdateCam(gam)
	if got := gam.Cam().X; got != 0 {
		t.Errorf("first reversed key cam X = %v, want 0", got)
	}
	in.PrevDir = in.Dir
	UpdateCam(gam)
	if got := gam.Cam().X; got != -4 {
		t.Errorf("second reversed key cam X = %v, want -4", got)
	}
}

// leaves a stopped camera at its rendered position rather than rounding it.
func TestUpdateCamKeyReleaseKeepsCam(t *testing.T) {
	gam := engine.New()
	*gam.Cam() = vgeo.NewXY[float32](1.5, 0)
	gam.Layer(gfx.LayerTiles).Scale = 4
	in := gam.In()
	in.PrevOn = vin.ButtonR
	UpdateCam(gam)
	if got := *gam.Cam(); got != vgeo.NewXY[float32](1.5, 0) {
		t.Errorf("key release cam = %v, want (1.5,0)", got)
	}
}

// preserves an inactive axis when a diagonal key is released.
func TestUpdateCamKeyReleaseAxisKeepsCam(t *testing.T) {
	gam := engine.New()
	*gam.Cam() = vgeo.NewXY[float32](4, 4)
	gam.Layer(gfx.LayerTiles).Scale = 4
	gam.Frame().DeltaMillis = 10
	gam.CamKeyPhy = vgeo.NewXY[float32](1, 4)
	in := gam.In()
	in.PrevDir = vgeo.NewXY[int8](-1, -1)
	in.Dir = vgeo.NewXY[int8](0, -1)
	in.DirOn = true
	in.On = vin.ButtonU
	UpdateCam(gam)
	if got := gam.Cam().X; got != 4 {
		t.Errorf("released axis cam X = %v, want 4", got)
	}
}

// snaps a pointer-panned camera to the lvl-px grid when dragging ends.
func TestUpdateCamDragReleaseSnap(t *testing.T) {
	gam := engine.New()
	*gam.Cam() = vgeo.XY[float32]{}
	gam.Layer(gfx.LayerTiles).Scale = 4
	in := gam.In()
	in.Ptr = &vin.Pointer{
		Drag: vin.Drag{On: true, DeltaPhy: vgeo.NewXY[float32](1.5, 0)},
	}
	UpdateCam(gam)
	if got := gam.Cam().X; got != -1.5 {
		t.Errorf("drag cam X = %v, want -1.5", got)
	}
	in.Ptr = &vin.Pointer{Drag: vin.Drag{End: true}}
	UpdateCam(gam)
	if got := gam.Cam().X; got != 0 {
		t.Errorf("released drag cam X = %v, want 0", got)
	}
}

// pans only when the drag began inside the visible lvl clip.
func TestUpdateCamDragStartsInLvlClip(t *testing.T) {
	tests := []struct {
		name  string
		start vgeo.XY[float32]
		want  float32
	}{
		{name: "outside", start: vgeo.NewXY[float32](99, 100)},
		{name: "inside", start: vgeo.NewXY[float32](100, 100), want: -1.5},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gam := engine.New()
			*gam.Cam() = vgeo.XY[float32]{}
			tiles := gam.Layer(gfx.LayerTiles)
			tiles.ClipPhy = vgeo.XYWH[uint16](100, 100, 200, 100)
			gam.In().Ptr = &vin.Pointer{
				Drag: vin.Drag{
					StartPhy: test.start,
					DeltaPhy: vgeo.NewXY[float32](1.5, 0),
					On:       true,
				},
			}
			UpdateCam(gam)
			if got := gam.Cam().X; got != test.want {
				t.Errorf("drag cam X = %v, want %v", got, test.want)
			}
		})
	}
}
