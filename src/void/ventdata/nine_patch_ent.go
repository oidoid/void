package ventdata

import (
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vgfx"
)

// to-do: rename ninep?
// 3x3 sprite panel. all sprites except corners are scaled to fit w/h. corners
// are assumed to be same size.
type NinePatchEnt struct {
	AnimByDir [9]vatlas.AnimID
	XY        vgeo.XY[float32]
	WH        vgeo.WH[uint16]
	CornerWH  vgeo.WH[uint16]
	Z         vgfx.Z
}

func NewNinePatchEnt(animByDir [9]vatlas.AnimID, cornerWH vgeo.WH[uint16]) NinePatchEnt {
	return NinePatchEnt{AnimByDir: animByDir, CornerWH: cornerWH}
}

func (this *NinePatchEnt) Update(sprites *[]vgfx.Sprite) {
	x := this.XY.X
	y := this.XY.Y
	w := float32(this.WH.W)
	h := float32(this.WH.H)
	cornerW := float32(this.CornerWH.W)
	cornerH := float32(this.CornerWH.H)
	midW := uint16(w - 2*cornerW)
	midH := uint16(h - 2*cornerH)

	*sprites = append(*sprites,
		// N edge.
		vgfx.Sprite{
			XY:      vgeo.NewXY(x+cornerW, y),
			AnimCel: this.AnimByDir[vgeo.DirN].Cel(0),
			Z:       this.Z,
			WH:      vgeo.WH[uint16]{W: midW, H: this.CornerWH.H},
		},
		// NE corner.
		vgfx.Sprite{
			XY:      vgeo.NewXY(x+w-cornerW, y),
			AnimCel: this.AnimByDir[vgeo.DirNE].Cel(0),
			Z:       this.Z,
			WH:      this.CornerWH,
		},
		// E edge.
		vgfx.Sprite{
			XY:      vgeo.NewXY(x+w-cornerW, y+cornerH),
			AnimCel: this.AnimByDir[vgeo.DirE].Cel(0),
			Z:       this.Z,
			WH:      vgeo.WH[uint16]{W: this.CornerWH.W, H: midH},
		},
		// SE corner.
		vgfx.Sprite{
			XY:      vgeo.NewXY(x+w-cornerW, y+h-cornerH),
			AnimCel: this.AnimByDir[vgeo.DirSE].Cel(0),
			Z:       this.Z,
			WH:      this.CornerWH,
		},
		// S edge.
		vgfx.Sprite{
			XY:      vgeo.NewXY(x+cornerW, y+h-cornerH),
			AnimCel: this.AnimByDir[vgeo.DirS].Cel(0),
			Z:       this.Z,
			WH:      vgeo.WH[uint16]{W: midW, H: this.CornerWH.H},
		},
		// SW corner.
		vgfx.Sprite{
			XY:      vgeo.NewXY(x, y+h-cornerH),
			AnimCel: this.AnimByDir[vgeo.DirSW].Cel(0),
			Z:       this.Z,
			WH:      this.CornerWH,
		},
		// W edge.
		vgfx.Sprite{
			XY:      vgeo.NewXY(x, y+cornerH),
			AnimCel: this.AnimByDir[vgeo.DirW].Cel(0),
			Z:       this.Z,
			WH:      vgeo.WH[uint16]{W: this.CornerWH.W, H: midH},
		},
		// NW corner.
		vgfx.Sprite{
			XY:      vgeo.NewXY(x, y),
			AnimCel: this.AnimByDir[vgeo.DirNW].Cel(0),
			Z:       this.Z,
			WH:      this.CornerWH,
		},
		// center.
		vgfx.Sprite{
			XY:      vgeo.NewXY(x+cornerW, y+cornerH),
			AnimCel: this.AnimByDir[vgeo.DirCenter].Cel(0),
			Z:       this.Z,
			WH:      vgeo.WH[uint16]{W: midW, H: midH},
		},
	)
}
