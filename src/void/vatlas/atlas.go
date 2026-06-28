package vatlas

// the number of cels every animation is padded to by repeating the sequence.
const CelsPerAnim = 16

// max animation loop duration in milliseconds.
const MaxAnimLoopMillis = 1000

// the duration of one cel in milliseconds (62.5).
const CelMillis = MaxAnimLoopMillis / CelsPerAnim

type Atlas struct {
	Anims []Anim
	Cels  []uint16 // cel subimages as XYWH.
}

// builds an Atlas from the compact [srcX, srcY] pairs produced by the atlas
// packer.
func NewAtlas(anims []Anim, celXY []uint16) Atlas {
	cels := make([]uint16, len(anims)*CelsPerAnim*4)
	cellI := 0
	for animI, anim := range anims {
		for cel := 0; cel < CelsPerAnim; cel++ {
			wrap := cel % int(anim.Cels)
			u16 := (animI*CelsPerAnim + cel) * 4
			cels[u16+0] = celXY[cellI+wrap*2]
			cels[u16+1] = celXY[cellI+wrap*2+1]
			cels[u16+2] = anim.W
			cels[u16+3] = anim.H
		}
		cellI += int(anim.Cels) * 2
	}
	return Atlas{Anims: anims, Cels: cels}
}
