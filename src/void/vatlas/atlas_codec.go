package vatlas

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vrle"
)

const (
	flagHitbox   = 1
	flagHurtbox  = 2
	flagDirMask  = 3
	flagDirShift = 2
	flagRepeat   = 16
)

func DecodeAtlas(bin []byte) Atlas {
	i := 0
	readByte := func() byte { val := bin[i]; i++; return val }
	readU16 := func() uint16 {
		val := uint16(bin[i]) | uint16(bin[i+1])<<8
		i += 2
		return val
	}
	readU32 := func() uint32 {
		val := uint32(bin[i]) | uint32(bin[i+1])<<8 |
			uint32(bin[i+2])<<16 | uint32(bin[i+3])<<24
		i += 4
		return val
	}
	readBox := func() vgeo.Box[uint16] {
		minX, minY, maxX, maxY := readU16(), readU16(), readU16(), readU16()
		return vgeo.NewBox(minX, minY, maxX, maxY)
	}
	metas := make([]TagMeta, int(readU16()))
	totalCels := 0
	for i := range metas {
		meta := &metas[i]
		meta.Cels, meta.W, meta.H = readByte(), readU16(), readU16()
		flags := readByte()
		meta.Dir = AnimDir(flags >> flagDirShift & flagDirMask)
		if flags&flagRepeat != 0 {
			meta.Repeat = readByte()
		}
		if flags&flagHitbox != 0 {
			meta.Hitbox = readBox()
		}
		if flags&flagHurtbox != 0 {
			meta.Hurtbox = readBox()
		}
		totalCels += int(meta.Cels)
	}
	cels := make([]Cel, totalCels)
	celI := 0
	for range readU32() {
		xy, count := readU32(), readU16()
		for range count {
			cels[celI].X, cels[celI].Y = uint16(xy), uint16(xy>>16)
			celI++
		}
	}
	celI = 0
	for range readU32() {
		millis, count := readU16(), readU16()
		for range count {
			cels[celI].Millis = millis
			celI++
		}
	}
	return NewAtlas(metas, cels)
}

// little-endian tag records followed by separately RLE-compressed XY and
// duration streams. tag starts are derived from counts, never stored twice.
//
// numTags(2)
// [cels(1) w(2) h(2) flags(1) [repeat(1)] [hitbox(8)] [hurtbox(8)]]*
// xyRuns(4) [xy(4) count(2)]*
// millisRuns(4) [millis(2) count(2)]*
func EncodeAtlas(atlas *Atlas) []byte {
	buf := appendU16(nil, uint16(len(atlas.Meta)))
	for _, meta := range atlas.Meta {
		buf = append(buf, meta.Cels)
		buf = appendU16(buf, meta.W)
		buf = appendU16(buf, meta.H)
		flags := uint8(meta.Dir) & flagDirMask << flagDirShift
		if meta.Repeat != 0 {
			flags |= flagRepeat
		}
		if meta.Hitbox != (vgeo.Box[uint16]{}) {
			flags |= flagHitbox
		}
		if meta.Hurtbox != (vgeo.Box[uint16]{}) {
			flags |= flagHurtbox
		}
		buf = append(buf, flags)
		if meta.Repeat != 0 {
			buf = append(buf, meta.Repeat)
		}
		if flags&flagHitbox != 0 {
			buf = appendBox(buf, meta.Hitbox)
		}
		if flags&flagHurtbox != 0 {
			buf = appendBox(buf, meta.Hurtbox)
		}
	}
	xy, millis := make([]uint32, len(atlas.Cels)), make([]uint16, len(atlas.Cels))
	for i, cel := range atlas.Cels {
		xy[i], millis[i] = uint32(cel.X)|uint32(cel.Y)<<16, cel.Millis
	}
	xyRuns := vrle.Encode[uint32, uint16](xy)
	buf = appendU32(buf, uint32(len(xyRuns)))
	for _, pair := range xyRuns {
		buf = appendU32(buf, pair.Val)
		buf = appendU16(buf, pair.Count)
	}
	millisRuns := vrle.Encode[uint16, uint16](millis)
	buf = appendU32(buf, uint32(len(millisRuns)))
	for _, pair := range millisRuns {
		buf = appendU16(buf, pair.Val)
		buf = appendU16(buf, pair.Count)
	}
	return buf
}

func appendBox(buf []byte, box vgeo.Box[uint16]) []byte {
	buf = appendU16(buf, box.Min.X)
	buf = appendU16(buf, box.Min.Y)
	buf = appendU16(buf, box.Max.X)
	return appendU16(buf, box.Max.Y)
}

func appendU16(buf []byte, val uint16) []byte {
	return append(buf, byte(val), byte(val>>8))
}

func appendU32(buf []byte, val uint32) []byte {
	return append(buf, byte(val), byte(val>>8), byte(val>>16), byte(val>>24))
}
