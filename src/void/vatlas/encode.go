package vatlas

import (
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vrle"
)

// serializes atlas to:
//
//	num_anims(2)
//	[cels(1) w(2) h(2) flags(1) [hitbox: minX(2) minY(2) maxX(2) maxY(2)] [hurtbox: minX(2) minY(2) maxX(2) maxY(2)]]*
//	rleLen(2) [v(2) count(2)]*
//
// all multi-byte integers are little-endian.
func EncodeAtlas(atlas *Atlas) []byte {
	var buf []byte
	buf = appendU16(buf, uint16(len(atlas.Anims)))
	for _, anim := range atlas.Anims {
		buf = append(buf, anim.Cels)
		buf = appendU16(buf, anim.W)
		buf = appendU16(buf, anim.H)
		var zeroBox vmath.Box[uint16]
		flags := uint8(0)
		if anim.Hitbox != zeroBox {
			flags |= flagHitbox
		}
		if anim.Hurtbox != zeroBox {
			flags |= flagHurtbox
		}
		buf = append(buf, flags)
		if anim.Hitbox != zeroBox {
			buf = appendBox(buf, anim.Hitbox)
		}
		if anim.Hurtbox != zeroBox {
			buf = appendBox(buf, anim.Hurtbox)
		}
	}
	// drop WH which is known from Anims. encode as uint32 since that's the size
	// of a cel that will repeat.
	celXY := make([]uint32, 0)
	for animIdx, anim := range atlas.Anims {
		base := animIdx * CelsPerAnim * 4
		for cel := 0; cel < int(anim.Cels); cel++ {
			x := uint32(atlas.Cels[base+cel*4])
			y := uint32(atlas.Cels[base+cel*4+1])
			celXY = append(celXY, x|y<<16)
		}
	}
	rle := vrle.Encode[uint32, uint16](celXY)
	buf = appendU16(buf, uint16(len(rle)))
	for _, pair := range rle {
		buf = appendU32(buf, pair.Val)
		buf = appendU16(buf, pair.Count)
	}
	return buf
}

func appendBox(buf []byte, box vmath.Box[uint16]) []byte {
	buf = appendU16(buf, box.Min.X)
	buf = appendU16(buf, box.Min.Y)
	buf = appendU16(buf, box.Max.X)
	buf = appendU16(buf, box.Max.Y)
	return buf
}

func appendU16(buf []byte, v uint16) []byte {
	return append(buf, byte(v), byte(v>>8))
}

func appendU32(buf []byte, v uint32) []byte {
	return append(buf, byte(v), byte(v>>8), byte(v>>16), byte(v>>24))
}
