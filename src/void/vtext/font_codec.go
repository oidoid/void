package vtext

import (
	"sort"
	"unicode/utf8"
)

// encodes a JSON kerning map to a flat byte slice `[l, r, kern, …]`,
// filtering entries that match the default kerning values.
func EncodeKerning(kerning map[string]int, defaultKerning, defaultWhitespaceKerning int) []byte {
	pairs := make(map[[2]byte]int8, len(kerning))
	for k, v := range kerning {
		l, size := utf8.DecodeRuneInString(k)
		r, _ := utf8.DecodeRuneInString(k[size:])
		kern := int8(v)
		if isBlankCh(l) || isBlankCh(r) {
			if kern == int8(defaultWhitespaceKerning) {
				continue
			}
		} else if kern == int8(defaultKerning) {
			continue
		}
		pairs[[2]byte{byte(l), byte(r)}] = kern
	}
	return encodeKerning(pairs)
}

// encodes a JSON charW map to a flat byte slice `[ch, w, …],
// filtering entries that match the default char width.
func EncodeWidths(charW map[string]int, defaultCharW int) []byte {
	var widths [256]uint8
	for i := range widths {
		widths[i] = uint8(defaultCharW)
	}
	for k, v := range charW {
		r, _ := utf8.DecodeRuneInString(k)
		widths[byte(r)] = uint8(v)
	}
	return encodeWidths(&widths, uint8(defaultCharW))
}

// encodes a JSON descends map to a flat byte slice `[ch, …]`.
func EncodeDescends(descends map[string]bool) []byte {
	m := make(map[byte]struct{}, len(descends))
	for k, v := range descends {
		if v {
			r, _ := utf8.DecodeRuneInString(k)
			m[byte(r)] = struct{}{}
		}
	}
	return encodeDescends(m)
}

func encodeKerning(pairs map[[2]byte]int8) []byte {
	keys := make([][2]byte, 0, len(pairs))
	for k := range pairs {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(i, j int) bool {
		if keys[i][0] != keys[j][0] {
			return keys[i][0] < keys[j][0]
		}
		return keys[i][1] < keys[j][1]
	})
	out := make([]byte, 0, len(keys)*3)
	for _, k := range keys {
		out = append(out, k[0], k[1], byte(pairs[k]))
	}
	return out
}

func encodeWidths(widths *[256]uint8, defaultCharW uint8) []byte {
	var out []byte
	for ch, w := range widths {
		if w != defaultCharW {
			out = append(out, byte(ch), w)
		}
	}
	return out
}

func encodeDescends(descends map[byte]struct{}) []byte {
	var bits [32]uint8
	for ch := range descends {
		bits[ch/8] |= 1 << (ch % 8)
	}
	var out []byte
	for i, word := range bits {
		for bit := 0; bit < 8; bit++ {
			if word>>(bit)&1 != 0 {
				out = append(out, byte(i*8+bit))
			}
		}
	}
	return out
}

func decodeFont(font *Font, kerning, widths, descends []byte) *Font {
	font.kerningPairs = make(map[[2]byte]int8, len(kerning)/3)
	for i := 0; i < len(kerning); i += 3 {
		font.kerningPairs[[2]byte{kerning[i], kerning[i+1]}] = int8(kerning[i+2])
	}
	for i := range font.charWidths {
		font.charWidths[i] = font.DefaultCharW
	}
	for i := 0; i < len(widths); i += 2 {
		font.charWidths[widths[i]] = widths[i+1]
	}
	font.descends = [32]uint8{}
	for _, b := range descends {
		font.descends[b/8] |= 1 << (b % 8)
	}
	return font
}
