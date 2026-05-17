package vatlas

import "github.com/oidoid/void/src/void/vmath"

func DecodeAtlas(bin []byte) Atlas {
	i := 0

	readByte := func() byte {
		b := bin[i]
		i++
		return b
	}
	readU16 := func() uint16 {
		v := uint16(bin[i]) | uint16(bin[i+1])<<8
		i += 2
		return v
	}
	readU32 := func() uint32 {
		v := uint32(bin[i]) | uint32(bin[i+1])<<8 | uint32(bin[i+2])<<16 | uint32(bin[i+3])<<24
		i += 4
		return v
	}
	readBox := func() vmath.Box[uint16] {
		minX, minY, maxX, maxY := readU16(), readU16(), readU16(), readU16()
		return vmath.NewBox(minX, minY, maxX, maxY)
	}

	numAnims := int(readU16())
	anims := make([]Anim, 0, numAnims)
	totalCels := 0
	for range numAnims {
		cels := readByte()
		w := readU16()
		h := readU16()
		flags := readByte()
		var hitbox, hurtbox vmath.Box[uint16]
		if flags&flagHitbox != 0 {
			hitbox = readBox()
		}
		if flags&flagHurtbox != 0 {
			hurtbox = readBox()
		}
		anims = append(anims, Anim{Cels: cels, W: w, H: h, Hitbox: hitbox, Hurtbox: hurtbox})
		totalCels += int(cels)
	}

	rleLen := int(readU16())
	celXY := make([]uint16, 0, totalCels*2)
	for range rleLen {
		val := readU32()
		count := int(readU16())
		for range count {
			celXY = append(celXY, uint16(val), uint16(val>>16))
		}
	}

	return NewAtlas(anims, celXY)
}
