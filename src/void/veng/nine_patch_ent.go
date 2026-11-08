package veng

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

// to-do: rename ninep?
// 3x3 spr panel. all sprs except corners are scaled to fit w/h. corners are
// assumed to be same size.
type NinePatchEnt struct {
	PatchByDir [9]vgfx.Spr
	XY         vgeo.XY[float32]
	WH         vgeo.WH[uint16]
	CornerWH   vgeo.WH[uint16]
}

func (this *NinePatchEnt) Z() vgfx.Z { return this.PatchByDir[0].Z }

func (this *NinePatchEnt) SetZ(z vgfx.Z) {
	for i := range this.PatchByDir {
		this.PatchByDir[i].Z = z
	}
}

func (this *NinePatchEnt) Update(sprs *[]vgfx.Spr) {
	this.updateAt(sprs, this.XY)
}

func (this *NinePatchEnt) updateAt(sprs *[]vgfx.Spr, xy vgeo.XY[float32]) {
	x, y := xy.X, xy.Y
	w, h := float32(this.WH.W), float32(this.WH.H)
	cornerW, cornerH := float32(this.CornerWH.W), float32(this.CornerWH.H)
	// clamp before converting: host Go wraps a negative float to uint16 while
	// TinyGo saturates it to zero.
	midW, midH := uint16(max(0, w-2*cornerW)), uint16(max(0, h-2*cornerH))
	// append first and position in place to skip a copy of the patches.
	start := len(*sprs)
	*sprs = append(*sprs, this.PatchByDir[:]...)
	patch := (*sprs)[start:]
	patch[vgeo.DirE].XY = vgeo.NewXY(x+w-cornerW, y+cornerH)
	patch[vgeo.DirE].WH = vgeo.NewWH(this.CornerWH.W, midH)
	patch[vgeo.DirNE].XY = vgeo.NewXY(x+w-cornerW, y)
	patch[vgeo.DirNE].WH = this.CornerWH
	patch[vgeo.DirN].XY = vgeo.NewXY(x+cornerW, y)
	patch[vgeo.DirN].WH = vgeo.NewWH(midW, this.CornerWH.H)
	patch[vgeo.DirNW].XY = vgeo.NewXY(x, y)
	patch[vgeo.DirNW].WH = this.CornerWH
	patch[vgeo.DirW].XY = vgeo.NewXY(x, y+cornerH)
	patch[vgeo.DirW].WH = vgeo.NewWH(this.CornerWH.W, midH)
	patch[vgeo.DirSW].XY = vgeo.NewXY(x, y+h-cornerH)
	patch[vgeo.DirSW].WH = this.CornerWH
	patch[vgeo.DirS].XY = vgeo.NewXY(x+cornerW, y+h-cornerH)
	patch[vgeo.DirS].WH = vgeo.NewWH(midW, this.CornerWH.H)
	patch[vgeo.DirSE].XY = vgeo.NewXY(x+w-cornerW, y+h-cornerH)
	patch[vgeo.DirSE].WH = this.CornerWH
	patch[vgeo.DirCenter].XY = vgeo.NewXY(x+cornerW, y+cornerH)
	patch[vgeo.DirCenter].WH = vgeo.NewWH(midW, midH)
}
