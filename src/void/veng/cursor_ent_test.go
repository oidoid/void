package veng

import (
	"fmt"
	"testing"

	"github.com/oidoid/void/src/void/vboards"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
)

func TestNewCursorEnt_Hitbox(t *testing.T) {
	hitbox := vgeo.XYWH[uint16](1, 2, 3, 4)
	ent := NewCursorEnt(vboards.Spawn{Tag: 1}, 0, 0, hitbox)
	want := vgeo.XYWH[float32](1, 2, 3, 4)
	if ent.Hitbox != want {
		t.Fatalf("Hitbox = %v, want %v", ent.Hitbox, want)
	}
}

func TestPixelCursorUsesDrawnOrigin(t *testing.T) {
	for _, circle := range []bool{false, true} {
		t.Run(fmt.Sprintf("circle%v", circle), func(t *testing.T) {
			eng := NewEng(&EngOpts{RenderMode: vgfx.RenderModePixel})
			layer := eng.Layer(1)
			layer.Scale = 2.5
			layer.Clip = defaultBounds
			layer.ClipPhy = vgeo.XYWH[uint16](20, 30, 500, 400)
			layer.Cam = vgeo.NewXY[float32](1.25, 2.5)
			ent := NewCursorEnt(vboards.Spawn{
				WH: vgeo.NewWH[float32](15, 17), Z: vgfx.Layer(1).Z(0),
			}, 0, 0, vgeo.XYWH[uint16](2, 3, 6, 8))
			ent.Circle = circle
			point := layer.LayerToPhy(vgeo.NewXY[float32](10.25, -.25))
			poll := vin.InPoll{PtrsLen: 1}
			poll.Ptrs[0] = vin.PtrPoll{
				ID: 1, Device: vin.PtrDevMouse, Primary: true,
				Phy: vgeo.XYWH(point.X, point.Y, float32(0), float32(0)),
			}
			eng.In().Update(0, &poll, vgeo.Box[float32]{})
			ent.Update(eng)
			wantOrigin := vgeo.NewXY[float32](10, 0)
			wantPhy := vgeo.NewBox[float32](48.75, 35, 63.75, 55)
			if circle {
				wantOrigin = vgeo.NewXY[float32](3, -9)
				wantPhy = vgeo.NewBox[float32](31.25, 12.5, 46.25, 32.5)
			}
			if got := ent.HitboxPhy(); got == nil || *got != wantPhy {
				t.Fatalf("physical bounds = %v, want %v", got, wantPhy)
			}
			if ent.XY != vgeo.NewXY[float32](10.25, -.25) {
				t.Fatalf("pointer source was rounded: %v", ent.XY)
			}
			if len(layer.Sprs) != 1 || layer.Sprs[0].XY != wantOrigin {
				t.Fatalf("drawn origin differs from collision origin: %v", layer.Sprs)
			}
			eng.In().Update(1, &poll, vgeo.Box[float32]{})
			eng.In().Dir = vgeo.NewXY[int8](1, 1)
			eng.Poll().DeltaMillis = 10
			ent.KbdEnabled, ent.KbdVel = true, 10
			layer.Sprs = layer.Sprs[:0]
			ent.Update(eng)
			if len(layer.Sprs) != 1 || layer.Sprs[0].XY != wantOrigin {
				t.Fatalf("keyboard handover moved the drawn origin: %v", layer.Sprs)
			}
		})
	}
}

func TestPixelCursorReprojectsStationaryPointer(t *testing.T) {
	eng := NewEng(&EngOpts{RenderMode: vgfx.RenderModePixel})
	layer := eng.Layer(0)
	layer.Scale = 2
	ent := NewCursorEnt(vboards.Spawn{}, 0, 0,
		vgeo.XYWH[uint16](0, 0, 2, 2))
	poll := vin.InPoll{PtrsLen: 1}
	poll.Ptrs[0] = vin.PtrPoll{
		ID: 1, Device: vin.PtrDevMouse, Primary: true,
		Phy: vgeo.XYWH[float32](21, 13, 0, 0),
	}
	eng.In().Update(0, &poll, vgeo.Box[float32]{})
	ent.Update(eng)
	layer.Scale = 3
	eng.In().Update(1, &poll, vgeo.Box[float32]{})
	ent.Update(eng)
	if got := ent.HitboxPhy(); got == nil ||
		*got != vgeo.NewBox[float32](21, 12, 27, 18) {
		t.Fatalf("stationary pointer bounds after resize = %v", got)
	}
}

func TestCursorEntUpdateEng(t *testing.T) {
	eng := NewEng(&EngOpts{MaxSprs: 1})
	ent := testCursorEnt(0)
	ent.Visible = true
	ent.KbdEnabled = true
	ent.Spr.Z = 4
	if stat := ent.Update(eng); stat != Pause {
		t.Errorf("Update() = %v, want Pause", stat)
	}
	if got := len(eng.Layer(ent.Spr.Z.Layer()).Sprs); got != 1 {
		t.Errorf("cursor layer sprs = %d, want 1", got)
	}
}

func TestUpdate_Hitbox(t *testing.T) {
	ent := NewCursorEnt(
		vboards.Spawn{Tag: 1}, 0, 1, vgeo.XYWH[uint16](1, 2, 3, 4),
	)
	setCursorXY(&ent, vgeo.NewXY[float32](10.5, 20.5))
	ent.Visible = true
	layer := vgfx.NewLayerConfig(0)
	sprs := []vgfx.Spr{}
	updateCursorEnt(&ent, vin.NewIn(), &sprs, 0, &layer)
	want := vgeo.NewBox[float32](11.5, 22.5, 14.5, 26.5)
	if ent.Hitbox != want {
		t.Fatalf("Hitbox = %v, want %v", ent.Hitbox, want)
	}
}

func TestUpdate_DrawSpawn(t *testing.T) {
	spawn := vboards.Spawn{
		XY:      vgeo.NewXY[float32](6, 7),
		WH:      vgeo.NewWH[float32](8.1, 12.1),
		Rot:     .5,
		Z:       vgfx.Z(4),
		Tag:     5,
		Cel:     2,
		Pal:     3,
		Hidden:  true,
		FlipX:   true,
		FlipY:   true,
		Stretch: true,
		ZTop:    true,
	}
	ent := NewCursorEnt(
		spawn, 0, 0, vgeo.Box[uint16]{},
	)
	ent.Visible = true
	ent.KbdEnabled = true
	layer := vgfx.NewLayerConfig(0)
	sprs := []vgfx.Spr{}
	updateCursorEnt(&ent, vin.NewIn(), &sprs, 0, &layer)
	if len(sprs) != 1 {
		t.Fatalf("len(sprs) = %d, want 1", len(sprs))
	}
	spr := sprs[0]
	if spr.Tag != 5 || spr.Cel != 2 || spr.Pal() != 3 || spr.Z != 4 {
		t.Errorf("spr = %#v, want tag 5, cel 2, pal 3, Z 4", spr)
	}
	if spr.XY != spawn.XY || spr.WH != vgeo.NewWH[uint16](9, 13) {
		t.Errorf("spr = %#v, want XY (6,7), WH (9,13)", spr)
	}
	if !spr.Hidden() || !spr.FlipX() || !spr.FlipY() ||
		!spr.Stretch() || !spr.ZTop() || spr.Rot() == 0 {
		t.Errorf("spr flags = %#v, want spawn flags and rotation", spr)
	}
}

func TestUpdate_CircleCenteredOnPointer(t *testing.T) {
	for _, test := range []struct {
		name   string
		device vin.PtrDevice
	}{
		{"mouse", vin.PtrDevMouse},
		{"touch", vin.PtrDevTouch},
		{"pen", vin.PtrDevPen},
	} {
		t.Run(test.name, func(t *testing.T) {
			ent := NewCursorEnt(
				vboards.Spawn{WH: vgeo.NewWH[float32](16, 16)},
				0, 10, vgeo.XYWH[uint16](2, 2, 12, 12),
			)
			ent.Circle = true
			point := vgeo.NewXY[float32](100, 78)
			poll := &vin.InPoll{PtrsLen: 1}
			poll.Ptrs[0] = vin.PtrPoll{
				ID: 1, Device: test.device, Primary: true,
				Phy: vgeo.XYWH(point.X, point.Y, float32(0), float32(0)),
			}
			in := vin.NewIn()
			layer := vgfx.NewLayerConfig(0)
			layer.ClipPhy = vgeo.XYWH[uint16](20, 30, 320, 240)
			layer.Cam = vgeo.NewXY[float32](4, 6)
			sprs := []vgfx.Spr{}
			for frame, scale := range []float32{2, 3, 3} {
				layer.Scale = scale
				sprs = sprs[:0]
				in.Update(float64(frame), poll, vgeo.Box[float32]{})
				updateCursorEnt(&ent, in, &sprs, 0, &layer)
				if got, want := ent.XY, layer.PhyToLayer(point); got != want {
					t.Fatalf("frame %d: input = %v, want %v", frame, got, want)
				}
				wantHitbox := vgeo.XYWH(
					point.X-6*scale, point.Y-6*scale, 12*scale, 12*scale,
				)
				if got := ent.HitboxPhy(); got == nil || *got != wantHitbox {
					t.Fatalf("frame %d: hitbox = %v, want %v", frame, got, wantHitbox)
				}
				if test.device != vin.PtrDevMouse {
					if len(sprs) != 0 {
						t.Fatal("touch or pen cursor was drawn")
					}
					continue
				}
				if len(sprs) != 1 {
					t.Fatalf("sprite count = %d, want 1", len(sprs))
				}
				center := sprs[0].XY.Add(vgeo.NewXY[float32](8, 8))
				if got := layer.LayerToPhy(center); got != point {
					t.Fatalf("frame %d: sprite center = %v, want %v", frame, got, point)
				}
			}
		})
	}
}

func TestButtonEnt_CircleCursorInteractions(t *testing.T) {
	for _, scales := range []struct{ cursor, button float32 }{
		{1, 1}, {4, 3}, {4, 4}, {4, 5}, {2.5, 1.25},
	} {
		for _, device := range []vin.PtrDevice{
			vin.PtrDevMouse, vin.PtrDevTouch, vin.PtrDevPen,
		} {
			for _, test := range []struct {
				name string
				x, y float32 // distance from the button's top-left in cursor radii.
				want bool
			}{
				{"inside", 0, 0, true},
				{"left contact", -1, 0, false},
				{"top contact", 0, -1, false},
				{"left overlap", -0.875, 0, true},
				{"top overlap", 0, -0.875, true},
				{"corner miss", -1, -1, false},
				{"just outside", -1.125, 0, false},
			} {
				t.Run(fmt.Sprintf("%s/cursor%g/button%g/device%d",
					test.name, scales.cursor, scales.button, device,
				), func(t *testing.T) {
					eng := NewEng(&EngOpts{MaxSprs: 10})
					eng.In().MapDefaults()
					poll := eng.Poll()
					poll.CanvasPhy = vgeo.NewWH[uint16](1408, 768)
					ui := eng.Layer(0)
					ui.Scale = scales.button
					ui.ClipPhy = vgeo.XYWH[uint16](20, 30, 1200, 700)
					eng.Layer(1).Scale = scales.cursor
					cursor := NewCursorEnt(
						vboards.Spawn{
							WH: vgeo.NewWH[float32](16, 16), Z: vgfx.Layer(1).Z(0),
						}, 0, 0, vgeo.XYWH[uint16](2, 2, 12, 12),
					)
					cursor.Circle = true
					eng.SetCursor(&cursor)
					button := ButtonEnt{}
					button.XY = vgeo.NewXY[float32](30, 30)
					button.WH = vgeo.NewWH[uint16](20, 10)
					clicks := 0
					button.OnClick = func(*ButtonEnt) { clicks++ }
					var hooks GameHooks[*Eng]
					hooks.RegisterUpdate(cursor.Update)
					hooks.RegisterUpdate(button.Update)
					update := func() {
						stat := eng.BeginTick()
						stat |= hooks.Preupdate(eng, eng)
						stat |= hooks.Update(eng)
						eng.EndTick(stat)
					}
					lo := ui.LayerToPhy(button.XY)
					radius := 6 * scales.cursor
					point := vgeo.NewXY(lo.X+test.x*radius, lo.Y+test.y*radius)
					poll.InPoll.PtrsLen = 1
					poll.InPoll.Ptrs[0] = vin.PtrPoll{
						ID: 1, Device: device, Primary: true,
						Phy: vgeo.XYWH(point.X, point.Y, float32(0), float32(0)),
					}
					for range 2 {
						update()
						if button.Focused != test.want {
							t.Fatalf("focused = %v, want %v", button.Focused, test.want)
						}
					}
					poll.InPoll.Ptrs[0].Clicks = vin.ClickPrimary
					update()
					if button.On != test.want {
						t.Fatalf("pressed = %v, want %v", button.On, test.want)
					}
					if got := eng.In().Mask&vin.ButtonA != 0; got != test.want {
						t.Fatalf("claimed input = %v, want %v", got, test.want)
					}
					if clicks != 0 {
						t.Fatal("button clicked before release")
					}
					poll.InPoll.Ptrs[0].Clicks = 0
					update()
					update()
					wantClicks := 0
					if test.want {
						wantClicks = 1
					}
					if clicks != wantClicks {
						t.Fatalf("clicks = %d, want %d", clicks, wantClicks)
					}
				})
			}
		}
	}
}

func TestUpdate_CircleKeyboardDoesNotDrift(t *testing.T) {
	ent := NewCursorEnt(
		vboards.Spawn{
			XY: vgeo.NewXY[float32](20, 30), WH: vgeo.NewWH[float32](16, 16),
		}, 0, 10, vgeo.XYWH[uint16](0, 0, 16, 16),
	)
	ent.Circle = true
	ent.KbdEnabled = true
	in := vin.NewIn()
	in.Dir = vgeo.NewXY[int8](1, 0)
	layer := vgfx.NewLayerConfig(0)
	layer.Clip = defaultBounds
	sprs := []vgfx.Spr{}
	for frame := range 5 {
		if frame == 3 {
			in.Dir = vgeo.XY[int8]{}
		}
		sprs = sprs[:0]
		updateCursorEnt(&ent, in, &sprs, .1, &layer)
		want := vgeo.NewXY(float32(20+min(frame+1, 3)), float32(30))
		if ent.XY != want || len(sprs) != 1 {
			t.Fatalf("frame %d: input = %v, want %v; sprites = %d",
				frame, ent.XY, want, len(sprs))
		}
		if got := sprs[0].XY.Add(vgeo.NewXY[float32](8, 8)); got != want {
			t.Fatalf("frame %d: sprite center = %v, want %v", frame, got, want)
		}
		in.PrevDir = in.Dir
	}
}

func TestUpdate_RestoresPointTag(t *testing.T) {
	ent := NewCursorEnt(
		vboards.Spawn{Tag: 1}, 2, 0, vgeo.Box[uint16]{},
	)
	ent.Visible = true
	ent.KbdEnabled = true
	in := vin.NewIn()
	in.On = vin.ButtonA
	in.PrevOn = vin.ButtonA
	layer := vgfx.NewLayerConfig(0)
	sprs := []vgfx.Spr{}
	updateCursorEnt(&ent, in, &sprs, 0, &layer)
	if got := sprs[0].Tag; got != 2 {
		t.Errorf("picked Tag = %d, want 2", got)
	}
	in.On = 0
	updateCursorEnt(&ent, in, &sprs, 0, &layer)
	if got := sprs[1].Tag; got != 1 {
		t.Errorf("released Tag = %d, want 1", got)
	}
}

func TestCursorEnt_DoesNotMaskInput(t *testing.T) {
	for _, mask := range []vin.Button{0, vin.ButtonA, vin.ButtonB} {
		eng := NewEng(&EngOpts{MaxSprs: 1})
		ent := NewCursorEnt(
			vboards.Spawn{Tag: 1}, 2, 10, vgeo.XYWH[uint16](0, 0, 1, 1),
		)
		ent.KbdEnabled = true
		in := eng.In()
		in.On = vin.ButtonA
		in.Mask = mask
		pressed := in.IsOnStart(vin.ButtonA)
		ent.Update(eng)
		wantTag := ent.pointTag
		if pressed {
			wantTag = ent.pickTag
		}
		if ent.Visible != pressed || ent.Spr.Tag != wantTag {
			t.Errorf("Mask=%v: cursor did not reflect the available press", mask)
		}
		if in.Mask != mask || in.IsOnStart(vin.ButtonA) != pressed {
			t.Errorf("Mask=%v: cursor changed input state", mask)
		}
	}
}

var defaultBounds = vgeo.XYWH[float32](-100, -100, 1000, 1000)

func moveCursorKey(
	ent *CursorEnt, in *vin.In, dir vgeo.XY[int8], deltaSecs float64,
) {
	in.PrevDir = in.Dir
	in.Dir = dir
	ent.onCursorKey(in, int(dir.X), int(dir.Y), deltaSecs, defaultBounds)
}

func TestNilHitboxPhy(t *testing.T) {
	var ent *CursorEnt
	if ent.HitboxPhy() != nil {
		t.Fatal("nil cursor HitboxPhy() != nil")
	}
}

func TestHitboxPhy(t *testing.T) {
	ent := NewCursorEnt(
		vboards.Spawn{Tag: 1}, 0, 10, vgeo.XYWH[uint16](4, 8, 2, 3),
	)
	layer := vgfx.NewLayerConfig(0)
	in := vin.NewIn()
	sprs := []vgfx.Spr{}
	updateCursorEnt(&ent, in, &sprs, 0, &layer)
	if ent.HitboxPhy() != nil {
		t.Fatal("hidden cursor without a pointer focused")
	}
	ent.Visible = true
	ent.KbdEnabled = true
	updateCursorEnt(&ent, in, &sprs, 0, &layer)
	if got := ent.HitboxPhy(); got == nil ||
		*got != vgeo.XYWH[float32](4, 8, 2, 3) {
		t.Errorf("visible cursor HitboxPhy() = %v, want (4,8,2,3)", got)
	}
	ent.Visible = false
	updateCursorEnt(&ent, in, &sprs, 0, &layer)
	if ent.HitboxPhy() != nil {
		t.Fatal("hidden keyboard cursor without input focused")
	}
	ent.KbdEnabled = false
	poll := &vin.InPoll{PtrsLen: 1}
	poll.Ptrs[0] = vin.PtrPoll{
		Device:  vin.PtrDevTouch,
		Primary: true,
	}
	in.Update(0, poll, vgeo.Box[float32]{})
	updateCursorEnt(&ent, in, &sprs, 0, &layer)
	if got := ent.HitboxPhy(); got == nil ||
		*got != vgeo.XYWH[float32](4, 8, 2, 3) {
		t.Errorf("touch cursor HitboxPhy() = %v, want (4,8,2,3)", got)
	}
}

// to-do: fix test naming.
func TestCursorEnt_HitsPhy(t *testing.T) {
	for _, test := range []struct {
		name   string
		circle bool
		box    vgeo.Box[float32]
		want   bool
	}{
		{"box overlap", false, vgeo.XYWH[float32](4, 4, 2, 2), true},
		{"box edge contact", false, vgeo.XYWH[float32](5, -1, 2, 2), false},
		{"box empty target", false, vgeo.Box[float32]{}, false},
		{"inside", true, vgeo.XYWH[float32](-1, -1, 2, 2), true},
		{"encloses", true, vgeo.XYWH[float32](-8, -8, 16, 16), true},
		{"left contact", true, vgeo.XYWH[float32](-7, -1, 2, 2), false},
		{"right contact", true, vgeo.XYWH[float32](5, -1, 2, 2), false},
		{"top contact", true, vgeo.XYWH[float32](-1, -7, 2, 2), false},
		{"bottom contact", true, vgeo.XYWH[float32](-1, 5, 2, 2), false},
		{"left overlap", true, vgeo.XYWH[float32](-6.875, -1, 2, 2), true},
		{"right overlap", true, vgeo.XYWH[float32](4.875, -1, 2, 2), true},
		{"top overlap", true, vgeo.XYWH[float32](-1, -6.875, 2, 2), true},
		{"bottom overlap", true, vgeo.XYWH[float32](-1, 4.875, 2, 2), true},
		{"corner contact", true, vgeo.XYWH[float32](3, 4, 2, 2), false},
		{"negative corner contact", true,
			vgeo.XYWH[float32](-5, -6, 2, 2), false},
		{"corner overlap", true, vgeo.XYWH[float32](3, 3.875, 2, 2), true},
		{"corner miss", true, vgeo.XYWH[float32](4, 4, 2, 2), false},
		{"just outside", true, vgeo.XYWH[float32](5.125, -1, 2, 2), false},
		{"negative outside", true,
			vgeo.XYWH[float32](-7.125, -1, 2, 2), false},
		{"point contact", true, vgeo.XYWH[float32](3, 4, 0, 0), false},
		{"empty point inside", true, vgeo.Box[float32]{}, false},
		{"empty width", true, vgeo.XYWH[float32](0, -1, 0, 2), false},
		{"empty height", true, vgeo.XYWH[float32](-1, 0, 2, 0), false},
		{"inverted width", true, vgeo.NewBox[float32](1, -1, -1, 1), false},
		{"inverted height", true, vgeo.NewBox[float32](-1, 1, 1, -1), false},
	} {
		t.Run(test.name, func(t *testing.T) {
			cursor := &CursorEnt{
				Circle:      test.circle,
				hitboxPhy:   vgeo.XYWH[float32](-5, -5, 10, 10),
				hitboxPhyOn: true,
			}
			if got := cursor.HitsPhy(test.box); got != test.want {
				t.Errorf("HitsBoxPhy(%v) = %v, want %v", test.box, got, test.want)
			}
		})
	}
}

func TestCursorEnt_HitsPhyInactive(t *testing.T) {
	for _, cursor := range []*CursorEnt{
		nil,
		{hitboxPhyOn: true},
		{Circle: true},
		{Circle: true, hitboxPhyOn: true},
	} {
		if cursor.HitsPhy(vgeo.XYWH[float32](-1, -1, 2, 2)) {
			t.Errorf("inactive or empty cursor hit: %+v", cursor)
		}
	}
}

func TestOnCursorPoint_SetsPosition(t *testing.T) {
	ent := testCursorEnt(0)
	layer := vgfx.NewLayerConfig(0)
	ent.onCursorPoint(
		vgeo.NewXY[float32](104, 204),
		vin.PtrDevMouse,
		&layer,
	)
	if ent.XY.X != 104 || ent.XY.Y != 204 {
		t.Fatalf("got (%v, %v), want (104, 204)", ent.XY.X, ent.XY.Y)
	}
}

func TestOnCursorPoint_VisibleForMouse(t *testing.T) {
	ent := testCursorEnt(0)
	layer := vgfx.NewLayerConfig(0)
	ent.onCursorPoint(vgeo.XY[float32]{}, vin.PtrDevMouse, &layer)
	if !ent.Visible {
		t.Fatal("want visible for Mouse, got hidden")
	}
}

func TestOnCursorPoint_HiddenForTouch(t *testing.T) {
	ent := testCursorEnt(0)
	layer := vgfx.NewLayerConfig(0)
	ent.onCursorPoint(vgeo.XY[float32]{}, vin.PtrDevTouch, &layer)
	if ent.Visible {
		t.Fatal("want hidden for Touch, got visible")
	}
}

func TestOnCursorKey_ClampsMinX(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](10, 0, 110, 100)
	setCursorXY(&ent, vgeo.NewXY[float32](15, 0))
	ent.onCursorKey(vin.NewIn(), -1, 0, 1, bounds)
	if ent.XY.X != 10 {
		t.Fatalf("got X=%v, want 10", ent.XY.X)
	}
}

func TestOnCursorKey_ClampsMaxX(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](0, 0, 50, 100)
	setCursorXY(&ent, vgeo.NewXY[float32](45, 0))
	ent.onCursorKey(vin.NewIn(), 1, 0, 1, bounds)
	if ent.XY.X != 50 {
		t.Fatalf("got X=%v, want 50", ent.XY.X)
	}
}

func TestOnCursorKey_ClampsMinY(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](0, 10, 100, 110)
	setCursorXY(&ent, vgeo.NewXY[float32](0, 15))
	ent.onCursorKey(vin.NewIn(), 0, -1, 1, bounds)
	if ent.XY.Y != 10 {
		t.Fatalf("got Y=%v, want 10", ent.XY.Y)
	}
}

func TestOnCursorKey_ClampsMaxY(t *testing.T) {
	ent := testCursorEnt(100)
	bounds := vgeo.NewBox[float32](0, 0, 100, 50)
	setCursorXY(&ent, vgeo.NewXY[float32](0, 45))
	ent.onCursorKey(vin.NewIn(), 0, 1, 1, bounds)
	if ent.XY.Y != 50 {
		t.Fatalf("got Y=%v, want 50", ent.XY.Y)
	}
}

func TestOnCursorKey_SetsVisible(t *testing.T) {
	ent := testCursorEnt(100)
	ent.Visible = false
	ent.onCursorKey(vin.NewIn(), 1, 0, .1, defaultBounds)
	if !ent.Visible {
		t.Fatal("want visible after key move, got hidden")
	}
}

func TestOnCursorKey_SnapsDiagonal(t *testing.T) {
	ent := testCursorEnt(10)
	setCursorXY(&ent, vgeo.NewXY[float32](.25, .75))
	in := vin.NewIn()
	ent.onCursorKey(in, 1, 1, .0125, defaultBounds)
	if got, want := ent.Spr.XY, vgeo.NewXY[float32](0, 1); got != want {
		t.Errorf("first diagonal snapXY = %v, want %v", got, want)
	}
	if got, want := ent.XY, vgeo.NewXY[float32](.125, 1.125); got != want {
		t.Errorf("first diagonal XY = %v, want %v", got, want)
	}
	in.PrevDir = vgeo.NewXY[int8](1, 1)
	ent.onCursorKey(in, 1, 1, .1, defaultBounds)
	if got, want := ent.Spr.XY, vgeo.NewXY[float32](1, 2); got != want {
		t.Errorf("second diagonal snapXY = %v, want %v", got, want)
	}
	if got, want := ent.XY, vgeo.NewXY[float32](1.125, 2.125); got != want {
		t.Errorf("second diagonal XY = %v, want %v", got, want)
	}
}

func TestOnCursorKey_AccumulatesSubpixels(t *testing.T) {
	ent := testCursorEnt(10)
	in := vin.NewIn()
	moveCursorKey(&ent, in, vgeo.NewXY[int8](1, 0), .05)
	if got, want := ent.Spr.XY, vgeo.NewXY[float32](0, 0); got != want {
		t.Errorf("first half-pixel snapXY = %v, want %v", got, want)
	}
	if got, want := ent.XY, vgeo.NewXY[float32](.5, 0); got != want {
		t.Errorf("first half-pixel XY = %v, want %v", got, want)
	}
	moveCursorKey(&ent, in, vgeo.NewXY[int8](1, 0), .05)
	if got, want := ent.Spr.XY, vgeo.NewXY[float32](1, 0); got != want {
		t.Errorf("second half-pixel snapXY = %v, want %v", got, want)
	}
}

func TestOnCursorKey_SyncsDiagonalAcrossDirectionChanges(t *testing.T) {
	ent := testCursorEnt(10)
	in := vin.NewIn()
	moveCursorKey(&ent, in, vgeo.NewXY[int8](1, 0), .1)
	moveCursorKey(&ent, in, vgeo.NewXY[int8](1, 1), .1)
	if got, want := ent.XY, vgeo.NewXY[float32](2, 1); got != want {
		t.Errorf("diagonal XY = %v, want %v", got, want)
	}
	moveCursorKey(&ent, in, vgeo.NewXY[int8](0, 1), .1)
	if got, want := ent.XY, vgeo.NewXY[float32](2, 2); got != want {
		t.Errorf("vertical XY = %v, want %v", got, want)
	}
}

func TestOnCursorKey_SlidesAtClipEdge(t *testing.T) {
	ent := testCursorEnt(10)
	setCursorXY(&ent, vgeo.NewXY[float32](50, 0))
	in := vin.NewIn()
	clip := vgeo.NewBox[float32](0, 0, 100, 100)
	move := func(dir vgeo.XY[int8]) {
		in.PrevDir = in.Dir
		in.Dir = dir
		ent.onCursorKey(in, int(dir.X), int(dir.Y), .1, clip)
	}
	for range 10 {
		move(vgeo.NewXY[int8](-1, -1))
	}
	before := ent.Spr.XY
	move(vgeo.NewXY[int8](-1, 0))
	if got, want := ent.Spr.X, before.X-1; got != want {
		t.Errorf("left after releasing up = %v, want %v", got, want)
	}
}

func TestOnCursorKey_RestartsAfterPoint(t *testing.T) {
	ent := testCursorEnt(10)
	setCursorXY(&ent, vgeo.NewXY[float32](100, 100))
	ent.kbdOn = true
	layer := vgfx.NewLayerConfig(0)
	ent.onCursorPoint(
		vgeo.NewXY[float32](.25, .75),
		vin.PtrDevMouse,
		&layer,
	)
	in := vin.NewIn()
	in.PrevDir = vgeo.NewXY[int8](1, 0)
	ent.onCursorKey(in, 1, 0, .0125, defaultBounds)
	if got, want := ent.Spr.XY, vgeo.NewXY[float32](0, 1); got != want {
		t.Errorf("keyboard restart snapXY = %v, want %v", got, want)
	}
	if got, want := ent.XY, vgeo.NewXY[float32](.125, 1); got != want {
		t.Errorf("keyboard restart XY = %v, want %v", got, want)
	}
}

func TestUpdate_KeyboardMode(t *testing.T) {
	ent := testCursorEnt(10)
	in := vin.NewIn()
	in.Dir = vgeo.NewXY[int8](1, 0)
	layer := vgfx.NewLayerConfig(0)
	layer.Clip = defaultBounds
	sprs := []vgfx.Spr{}
	if got := updateCursorEnt(&ent, in, &sprs, .1, &layer); got != Pause {
		t.Errorf("disabled keyboard cursor update = %v, want Pause", got)
	}
	if got := ent.XY.X; got != 0 {
		t.Errorf("disabled keyboard cursor X = %v, want 0", got)
	}
	ent.KbdEnabled = true
	if got := updateCursorEnt(&ent, in, &sprs, .1, &layer); got != Loop {
		t.Errorf("moving keyboard cursor update = %v, want Loop", got)
	}
	if got := ent.XY.X; got != 1 {
		t.Errorf("enabled keyboard cursor X = %v, want 1", got)
	}
}

// keeps a held direction updating when its initial frame has no elapsed time.
func TestUpdate_KeyboardModeZeroDeltaLoops(t *testing.T) {
	ent := testCursorEnt(10)
	ent.KbdEnabled = true
	in := vin.NewIn()
	in.Dir = vgeo.NewXY[int8](1, 0)
	layer := vgfx.NewLayerConfig(0)
	layer.Clip = defaultBounds
	sprs := []vgfx.Spr{}
	if got := updateCursorEnt(&ent, in, &sprs, 0, &layer); got != Loop {
		t.Errorf("zero-delta keyboard cursor update = %v, want Loop", got)
	}
	if got := ent.XY; got != (vgeo.XY[float32]{}) {
		t.Errorf("zero-delta keyboard cursor XY = %v, want zero", got)
	}
}

func TestUpdate_PtrLeaves(t *testing.T) {
	tests := []struct {
		name       string
		kbdEnabled bool
		want       bool
	}{
		{name: "pointer cursor", want: false},
		{name: "keyboard cursor", kbdEnabled: true, want: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ent := testCursorEnt(10)
			ent.KbdEnabled = test.kbdEnabled
			in := vin.NewIn()
			layer := vgfx.NewLayerConfig(0)
			sprs := []vgfx.Spr{}
			poll := &vin.InPoll{PtrsLen: 1}
			poll.Ptrs[0] = vin.PtrPoll{
				Phy:     vgeo.NewBox[float32](4, 8, 4, 8),
				Device:  vin.PtrDevMouse,
				Primary: true,
			}
			in.Update(0, poll, vgeo.Box[float32]{})
			updateCursorEnt(&ent, in, &sprs, 0, &layer)
			if !ent.Visible {
				t.Fatal("cursor hidden while mouse is present")
			}
			in.Update(1, &vin.InPoll{}, vgeo.Box[float32]{})
			updateCursorEnt(&ent, in, &sprs, 0, &layer)
			if ent.Visible != test.want {
				t.Errorf("cursor visible after mouse leaves = %v, want %v",
					ent.Visible, test.want)
			}
		})
	}
}

func TestUpdate_KeyboardModeFollowsMovedPtr(t *testing.T) {
	ent := testCursorEnt(10)
	ent.KbdEnabled = true
	in := vin.NewIn()
	in.MapDefaultKeyboard()
	layer := vgfx.NewLayerConfig(0)
	layer.Clip = defaultBounds
	sprs := []vgfx.Spr{}
	update := func(now float64, x float32, keys vin.Key) {
		poll := &vin.InPoll{
			Kbd:     vin.KeyboardPoll{Keys: keys},
			PtrsLen: 1,
		}
		poll.Ptrs[0] = vin.PtrPoll{
			Phy:     vgeo.NewBox(x, float32(0), x, float32(0)),
			Device:  vin.PtrDevMouse,
			Primary: true,
		}
		in.Update(now, poll, vgeo.Box[float32]{})
		updateCursorEnt(&ent, in, &sprs, .1, &layer)
	}
	update(0, 2, 0)
	update(1, 2, vin.KeyRight)
	if got, want := ent.XY, vgeo.NewXY[float32](3, 0); got != want {
		t.Errorf("stationary pointer keyboard XY = %v, want %v", got, want)
	}
	update(2, 20, vin.KeyRight)
	if got, want := ent.XY, vgeo.NewXY[float32](20, 0); got != want {
		t.Errorf("moved pointer keyboard XY = %v, want %v", got, want)
	}
	update(3, 20, vin.KeyRight)
	if got, want := ent.XY, vgeo.NewXY[float32](21, 0); got != want {
		t.Errorf("keyboard after moved pointer XY = %v, want %v", got, want)
	}
	ent.KbdEnabled = false
	update(4, 20, 0)
	if got, want := ent.XY, vgeo.NewXY[float32](21, 0); got != want {
		t.Errorf("disabled keyboard cursor XY = %v, want %v", got, want)
	}
	update(5, 8, 0)
	if got, want := ent.XY, vgeo.NewXY[float32](8, 0); got != want {
		t.Errorf("moved pointer keyboard XY = %v, want %v", got, want)
	}
}

func TestUpdate_KeyboardReleaseKeepsPosition(t *testing.T) {
	ent := testCursorEnt(10)
	ent.KbdEnabled = true
	in := vin.NewIn()
	in.Dir = vgeo.NewXY[int8](1, 0)
	layer := vgfx.NewLayerConfig(0)
	layer.Clip = defaultBounds
	sprs := []vgfx.Spr{}
	updateCursorEnt(&ent, in, &sprs, .1, &layer)
	in.PrevDir = in.Dir
	in.Dir = vgeo.XY[int8]{}
	updateCursorEnt(&ent, in, &sprs, .1, &layer)
	if got, want := ent.XY, vgeo.NewXY[float32](1, 0); got != want {
		t.Errorf("released keyboard cursor XY = %v, want %v", got, want)
	}
}

func testCursorEnt(keyboard float32) CursorEnt {
	return NewCursorEnt(
		vboards.Spawn{Tag: 1}, 0, keyboard, vgeo.Box[uint16]{},
	)
}

func updateCursorEnt(
	ent *CursorEnt, in *vin.In, sprs *[]vgfx.Spr,
	deltaSecs float64, layer *vgfx.LayerConfig,
) Status {
	eng := &Eng{in: in}
	eng.poll.DeltaMillis = deltaSecs * 1000
	eng.layers[ent.Spr.Z.Layer()] = *layer
	eng.layers[ent.Spr.Z.Layer()].Sprs = *sprs
	stat := ent.Update(eng)
	*sprs = eng.layers[ent.Spr.Z.Layer()].Sprs
	return stat
}

func setCursorXY(ent *CursorEnt, xy vgeo.XY[float32]) {
	ent.XY = xy
	ent.Spr.XY = xy
}
