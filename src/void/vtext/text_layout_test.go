package vtext

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/oidoid/void/src/void/vmath"
)

var zero vmath.Box[int16] // whitespace.

func TestLayoutText(t *testing.T) {
	font := MemProp5x6
	const lH = 7 // font.lineH
	const cH = 6 // font.cellH
	const maxW = 8191

	type tcase struct {
		str      string
		w        int16
		expected TextLayout
	}
	cases := []tcase{
		// case 0: empty string
		{
			str: "",
			w:   maxW,
			expected: TextLayout{
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 0, Y: 7}},
				Chars:    nil,
				Cursor:   vmath.NewXY[int16](0, 0*lH),
				TrimmedH: 0,
			},
		},
		// case 1: single space
		{
			str: " ",
			w:   maxW,
			expected: TextLayout{
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 0, Y: 7}},
				Chars:    []vmath.Box[int16]{zero},
				Cursor:   vmath.NewXY[int16](4, 0*lH),
				TrimmedH: 5,
			},
		},
		// case 2: newline only
		{
			str: "\n",
			w:   maxW,
			expected: TextLayout{
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 0, Y: 14}},
				Chars:    []vmath.Box[int16]{zero},
				Cursor:   vmath.NewXY[int16](0, 1*lH),
				TrimmedH: 7,
			},
		},
		// case 3: "abc def ghi jkl mno" unlimited width
		{
			str: "abc def ghi jkl mno",
			w:   maxW,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH), XYWH(8, 0*lH, 3, cH), zero,
					XYWH(13, 0*lH, 3, cH), XYWH(17, 0*lH, 3, cH), XYWH(21, 0*lH, 3, cH), zero,
					XYWH(26, 0*lH, 3, cH), XYWH(30, 0*lH, 3, cH), XYWH(34, 0*lH, 1, cH), zero,
					XYWH(37, 0*lH, 3, cH), XYWH(41, 0*lH, 3, cH), XYWH(45, 0*lH, 1, cH), zero,
					XYWH(48, 0*lH, 5, cH), XYWH(54, 0*lH, 3, cH), XYWH(58, 0*lH, 3, cH),
				},
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 61, Y: 7}},
				Cursor:   vmath.NewXY[int16](61, 0*lH),
				TrimmedH: 6,
			},
		},
		// case 4: "abc def ghi jkl mno" width=10
		{
			str: "abc def ghi jkl mno",
			w:   10,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH), XYWH(8, 0*lH, 3, cH), zero,
					XYWH(0, 1*lH, 3, cH), XYWH(4, 1*lH, 3, cH), XYWH(8, 1*lH, 3, cH), zero,
					XYWH(0, 2*lH, 3, cH), XYWH(4, 2*lH, 3, cH), XYWH(8, 2*lH, 1, cH), zero,
					XYWH(0, 3*lH, 3, cH), XYWH(4, 3*lH, 3, cH), XYWH(8, 3*lH, 1, cH), zero,
					XYWH(0, 4*lH, 5, cH), XYWH(6, 4*lH, 3, cH), XYWH(0, 5*lH, 3, cH),
				},
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 10, Y: 42}},
				Cursor:   vmath.NewXY[int16](3, 5*lH),
				TrimmedH: 40,
			},
		},
		// case 5: "abc def ghi jkl mno" width=20
		{
			str: "abc def ghi jkl mno",
			w:   20,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH), XYWH(8, 0*lH, 3, cH), zero,
					XYWH(0, 1*lH, 3, cH), XYWH(4, 1*lH, 3, cH), XYWH(8, 1*lH, 3, cH), zero,
					XYWH(0, 2*lH, 3, cH), XYWH(4, 2*lH, 3, cH), XYWH(8, 2*lH, 1, cH), zero,
					XYWH(11, 2*lH, 3, cH), XYWH(15, 2*lH, 3, cH), XYWH(19, 2*lH, 1, cH), zero,
					XYWH(0, 3*lH, 5, cH), XYWH(6, 3*lH, 3, cH), XYWH(10, 3*lH, 3, cH),
				},
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 19, Y: 28}},
				Cursor:   vmath.NewXY[int16](13, 3*lH),
				TrimmedH: 26,
			},
		},
		// case 6: "abc def ghi jkl mno" width=21
		{
			str: "abc def ghi jkl mno",
			w:   21,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH), XYWH(8, 0*lH, 3, cH), zero,
					XYWH(0, 1*lH, 3, cH), XYWH(4, 1*lH, 3, cH), XYWH(8, 1*lH, 3, cH), zero,
					XYWH(13, 1*lH, 3, cH), XYWH(17, 1*lH, 3, cH), XYWH(21, 1*lH, 1, cH), zero,
					XYWH(0, 2*lH, 3, cH), XYWH(4, 2*lH, 3, cH), XYWH(8, 2*lH, 1, cH), zero,
					XYWH(0, 3*lH, 5, cH), XYWH(6, 3*lH, 3, cH), XYWH(10, 3*lH, 3, cH),
				},
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 21, Y: 28}},
				Cursor:   vmath.NewXY[int16](13, 3*lH),
				TrimmedH: 27,
			},
		},
		// case 7: "a  b" width=4
		{
			str: "a  b",
			w:   4,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), zero, zero,
					XYWH(0, 2*lH, 3, cH),
				},
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 3, Y: 21}},
				Cursor:   vmath.NewXY[int16](3, 2*lH),
				TrimmedH: 19,
			},
		},
		// case 8: "a  b " width=4
		{
			str: "a  b ",
			w:   4,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), zero, zero,
					XYWH(0, 2*lH, 3, cH), zero,
				},
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 2, Y: 28}},
				Cursor:   vmath.NewXY[int16](0, 3*lH),
				TrimmedH: 26,
			},
		},
		// case 9: "a\n" width=3
		{
			str: "a\n",
			w:   3,
			expected: TextLayout{
				Chars:    []vmath.Box[int16]{XYWH(0, 0*lH, 3, cH), zero},
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 3, Y: 14}},
				Cursor:   vmath.NewXY[int16](0, 1*lH),
				TrimmedH: 7,
			},
		},
		// case 10: "hello, void!" unlimited width — exercises narrow-char kerning (e→l, o→i)
		{
			str: "hello, void!",
			w:   maxW,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH),  // h
					XYWH(4, 0*lH, 3, cH),  // e  (e→l span=4: charW=3 + defaultKerning=1)
					XYWH(8, 0*lH, 1, cH),  // l  (l→l span=2: charW=1 + defaultKerning=1)
					XYWH(10, 0*lH, 1, cH), // l  (l→o span=2: charW=1 + defaultKerning=1)
					XYWH(12, 0*lH, 3, cH), // o
					XYWH(16, 0*lH, 1, cH), // ,  (,→' ' span=0: charW=1 + whitespaceKerning=-1)
					zero,                  // ' '
					XYWH(19, 0*lH, 3, cH), // v
					XYWH(23, 0*lH, 3, cH), // o  (o→i span=4: charW=3 + defaultKerning=1)
					XYWH(27, 0*lH, 1, cH), // i  (i→d span=2: charW=1 + defaultKerning=1)
					XYWH(29, 0*lH, 3, cH), // d
					XYWH(33, 0*lH, 1, cH), // !
				},
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 34, Y: 7}},
				Cursor:   vmath.NewXY[int16](34, 0*lH),
				TrimmedH: 6,
			},
		},
	}

	for i, tc := range cases {
		t.Run(fmt.Sprintf("Case %d: str=%q w=%v", i, tc.str, tc.w), func(t *testing.T) {
			got := LayoutText(TextLayoutOpts{Font: font, Text: tc.str, MaxW: tc.w})
			assertLayout(t, got, tc.expected)
		})
	}
}

func TestLayoutWord(t *testing.T) {
	font := MemProp5x6
	const lH = 7 // font.lineH
	const cH = 6 // font.cellH
	const maxW = 8191

	type tcase struct {
		xy       vmath.XY[int16]
		maxW     int16
		str      string
		index    int
		expected TextLayout
	}
	cases := []tcase{
		// case 0: space at start → no chars
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: " ", index: 0,
			expected: TextLayout{Chars: nil, Cursor: vmath.NewXY[int16](0, 0*lH), Box: vmath.Box[int16]{}},
		},
		// case 1: empty string
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "", index: 0,
			expected: TextLayout{Chars: nil, Cursor: vmath.NewXY[int16](0, 0*lH), Box: vmath.Box[int16]{}},
		},
		// case 2: newline at start → no chars
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "\n", index: 0,
			expected: TextLayout{Chars: nil, Cursor: vmath.NewXY[int16](0, 0*lH), Box: vmath.Box[int16]{}},
		},
		// case 3: "a"
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "a", index: 0,
			expected: TextLayout{
				Chars:    []vmath.Box[int16]{XYWH(0, 0*lH, 3, cH)},
				Cursor:   vmath.NewXY[int16](3, 0*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 3}},
			},
		},
		// case 4: "."
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: ".", index: 0,
			expected: TextLayout{
				Chars:    []vmath.Box[int16]{XYWH(0, 0*lH, 1, cH)},
				Cursor:   vmath.NewXY[int16](1, 0*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 1}},
			},
		},
		// case 5: "a " → only 'a', space stops word
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "a ", index: 0,
			expected: TextLayout{
				Chars:    []vmath.Box[int16]{XYWH(0, 0*lH, 3, cH)},
				Cursor:   vmath.NewXY[int16](2, 0*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 2}},
			},
		},
		// case 6: "a\n" → only 'a', newline stops word
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "a\n", index: 0,
			expected: TextLayout{
				Chars:    []vmath.Box[int16]{XYWH(0, 0*lH, 3, cH)},
				Cursor:   vmath.NewXY[int16](3, 0*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 3}},
			},
		},
		// case 7: "a a" → only first 'a'
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "a a", index: 0,
			expected: TextLayout{
				Chars:    []vmath.Box[int16]{XYWH(0, 0*lH, 3, cH)},
				Cursor:   vmath.NewXY[int16](2, 0*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 2}},
			},
		},
		// case 8: "a."
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "a.", index: 0,
			expected: TextLayout{
				Chars:    []vmath.Box[int16]{XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 1, cH)},
				Cursor:   vmath.NewXY[int16](5, 0*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 5}},
			},
		},
		// case 9: "aa"
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "aa", index: 0,
			expected: TextLayout{
				Chars:    []vmath.Box[int16]{XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH)},
				Cursor:   vmath.NewXY[int16](7, 0*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 7}},
			},
		},
		// case 10: "aa\n"
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "aa\n", index: 0,
			expected: TextLayout{
				Chars:    []vmath.Box[int16]{XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH)},
				Cursor:   vmath.NewXY[int16](7, 0*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 7}},
			},
		},
		// case 11: "aa aa" → stops at space
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "aa aa", index: 0,
			expected: TextLayout{
				Chars:    []vmath.Box[int16]{XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH)},
				Cursor:   vmath.NewXY[int16](6, 0*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 6}},
			},
		},
		// case 12: "g" (descends)
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "g", index: 0,
			expected: TextLayout{
				Chars:    []vmath.Box[int16]{XYWH(0, 0*lH, 3, cH)},
				Cursor:   vmath.NewXY[int16](3, 0*lH),
				TrimmedH: 6,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 3}},
			},
		},
		// case 13: "abcdefgh" full word, maxW=unlimited, index=0
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH), XYWH(8, 0*lH, 3, cH), XYWH(12, 0*lH, 3, cH),
					XYWH(16, 0*lH, 3, cH), XYWH(20, 0*lH, 3, cH), XYWH(24, 0*lH, 3, cH), XYWH(28, 0*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](31, 0*lH),
				TrimmedH: 6,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 31}},
			},
		},
		// case 14: "abcdefgh" index=1 → starts at 'b'
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "abcdefgh", index: 1,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH), XYWH(8, 0*lH, 3, cH), XYWH(12, 0*lH, 3, cH),
					XYWH(16, 0*lH, 3, cH), XYWH(20, 0*lH, 3, cH), XYWH(24, 0*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](27, 0*lH),
				TrimmedH: 6,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 27}},
			},
		},
		// case 15: "abcdefgh" index=8 → past end
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: maxW, str: "abcdefgh", index: 8,
			expected: TextLayout{Chars: nil, Cursor: vmath.NewXY[int16](0, 0*lH), Box: vmath.Box[int16]{}},
		},
		// case 16: "abcdefgh" maxW=0, index=0 → each char wraps
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: 0, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(0, 1*lH, 3, cH), XYWH(0, 2*lH, 3, cH), XYWH(0, 3*lH, 3, cH),
					XYWH(0, 4*lH, 3, cH), XYWH(0, 5*lH, 3, cH), XYWH(0, 6*lH, 3, cH), XYWH(0, 7*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](3, 7*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 4}},
			},
		},
		// case 17: "abcdefgh" maxW=1, index=0 → each char wraps
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: 1, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(0, 1*lH, 3, cH), XYWH(0, 2*lH, 3, cH), XYWH(0, 3*lH, 3, cH),
					XYWH(0, 4*lH, 3, cH), XYWH(0, 5*lH, 3, cH), XYWH(0, 6*lH, 3, cH), XYWH(0, 7*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](3, 7*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 4}},
			},
		},
		// case 18: "abcdefgh" maxW=3, index=0
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: 3, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(0, 1*lH, 3, cH), XYWH(0, 2*lH, 3, cH), XYWH(0, 3*lH, 3, cH),
					XYWH(0, 4*lH, 3, cH), XYWH(0, 5*lH, 3, cH), XYWH(0, 6*lH, 3, cH), XYWH(0, 7*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](3, 7*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 4}},
			},
		},
		// case 19: "abcdefgh" maxW=5, index=0
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: 5, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(0, 1*lH, 3, cH), XYWH(0, 2*lH, 3, cH), XYWH(0, 3*lH, 3, cH),
					XYWH(0, 4*lH, 3, cH), XYWH(0, 5*lH, 3, cH), XYWH(0, 6*lH, 3, cH), XYWH(0, 7*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](3, 7*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 4}},
			},
		},
		// case 20: "abcdefgh" maxW=6, index=0
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: 6, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(0, 1*lH, 3, cH), XYWH(0, 2*lH, 3, cH), XYWH(0, 3*lH, 3, cH),
					XYWH(0, 4*lH, 3, cH), XYWH(0, 5*lH, 3, cH), XYWH(0, 6*lH, 3, cH), XYWH(0, 7*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](3, 7*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 4}},
			},
		},
		// case 21: "abcdefgh" maxW=7, index=0 → fits 2 per row starting at 7
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: 7, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(0, 1*lH, 3, cH), XYWH(0, 2*lH, 3, cH), XYWH(0, 3*lH, 3, cH),
					XYWH(0, 4*lH, 3, cH), XYWH(0, 5*lH, 3, cH), XYWH(0, 6*lH, 3, cH), XYWH(4, 6*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](7, 6*lH),
				TrimmedH: 6,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 7}},
			},
		},
		// case 22: "abcdefgh" maxW=8, index=0 → 2 per row
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: 8, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH),
					XYWH(0, 1*lH, 3, cH), XYWH(4, 1*lH, 3, cH),
					XYWH(0, 2*lH, 3, cH), XYWH(4, 2*lH, 3, cH),
					XYWH(0, 3*lH, 3, cH), XYWH(4, 3*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](7, 3*lH),
				TrimmedH: 6,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 8}},
			},
		},
		// case 23: "abcdefgh" maxW=9, index=0 → 2 per row
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: 9, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH),
					XYWH(0, 1*lH, 3, cH), XYWH(4, 1*lH, 3, cH),
					XYWH(0, 2*lH, 3, cH), XYWH(4, 2*lH, 3, cH),
					XYWH(0, 3*lH, 3, cH), XYWH(4, 3*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](7, 3*lH),
				TrimmedH: 6,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 8}},
			},
		},
		// case 24: "abcdefgh" maxW=10, index=0 → 2 per row
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: 10, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH),
					XYWH(0, 1*lH, 3, cH), XYWH(4, 1*lH, 3, cH),
					XYWH(0, 2*lH, 3, cH), XYWH(4, 2*lH, 3, cH),
					XYWH(0, 3*lH, 3, cH), XYWH(4, 3*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](7, 3*lH),
				TrimmedH: 6,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 8}},
			},
		},
		// case 25: "abcdefgh" maxW=11, index=0 → 2 per row
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: 11, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH),
					XYWH(0, 1*lH, 3, cH), XYWH(4, 1*lH, 3, cH),
					XYWH(0, 2*lH, 3, cH), XYWH(4, 2*lH, 3, cH),
					XYWH(0, 3*lH, 3, cH), XYWH(4, 3*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](7, 3*lH),
				TrimmedH: 6,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 8}},
			},
		},
		// case 26: "abcdefgh" maxW=12, index=0 → 3 per row
		{
			xy: vmath.NewXY[int16](0, 0*lH), maxW: 12, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 0*lH, 3, cH), XYWH(4, 0*lH, 3, cH), XYWH(8, 0*lH, 3, cH),
					XYWH(0, 1*lH, 3, cH), XYWH(4, 1*lH, 3, cH), XYWH(8, 1*lH, 3, cH),
					XYWH(0, 2*lH, 3, cH), XYWH(4, 2*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](7, 2*lH),
				TrimmedH: 6,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 12}},
			},
		},
		// case 27: "abcdefgh" maxW=5, xy={1,0}, index=0 → first fits, rest wrap
		{
			xy: vmath.NewXY[int16](1, 0*lH), maxW: 5, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(1, 0*lH, 3, cH),
					XYWH(0, 1*lH, 3, cH), XYWH(0, 2*lH, 3, cH), XYWH(0, 3*lH, 3, cH),
					XYWH(0, 4*lH, 3, cH), XYWH(0, 5*lH, 3, cH), XYWH(0, 6*lH, 3, cH), XYWH(0, 7*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](3, 7*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 5}},
			},
		},
		// case 28: "abcdefgh" maxW=5, xy={2,0}, index=0 → first doesn't fit, all on new lines
		{
			xy: vmath.NewXY[int16](2, 0*lH), maxW: 5, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 1*lH, 3, cH), XYWH(0, 2*lH, 3, cH), XYWH(0, 3*lH, 3, cH), XYWH(0, 4*lH, 3, cH),
					XYWH(0, 5*lH, 3, cH), XYWH(0, 6*lH, 3, cH), XYWH(0, 7*lH, 3, cH), XYWH(0, 8*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](3, 8*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 4}},
			},
		},
		// case 29: "abcdefgh" maxW=5, xy={2,1}, index=0 → same but y offset by 1
		{
			xy: vmath.NewXY[int16](2, 1+0*lH), maxW: 5, str: "abcdefgh", index: 0,
			expected: TextLayout{
				Chars: []vmath.Box[int16]{
					XYWH(0, 1+1*lH, 3, cH), XYWH(0, 1+2*lH, 3, cH), XYWH(0, 1+3*lH, 3, cH), XYWH(0, 1+4*lH, 3, cH),
					XYWH(0, 1+5*lH, 3, cH), XYWH(0, 1+6*lH, 3, cH), XYWH(0, 1+7*lH, 3, cH), XYWH(0, 1+8*lH, 3, cH),
				},
				Cursor:   vmath.NewXY[int16](3, 1+8*lH),
				TrimmedH: 5,
				Box:      vmath.Box[int16]{Max: vmath.XY[int16]{X: 4}},
			},
		},
	}

	for i, tc := range cases {
		t.Run(
			fmt.Sprintf("case %d: xy=(%v,%v) maxW=%v str=%q index=%d", i, tc.xy.X, tc.xy.Y, tc.maxW, tc.str, tc.index),
			func(t *testing.T) {
				got := layoutWord(font, tc.xy, tc.maxW, []rune(tc.str), tc.index, 0, 1, 0, 0)
				assertWordLayout(t, got, tc.expected)
			},
		)
	}
}

func assertLayout(t *testing.T, got, want TextLayout) {
	t.Helper()
	if len(got.Chars) == 0 && len(want.Chars) == 0 {
		got.Chars, want.Chars = nil, nil
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got  %+v\nwant %+v", got, want)
	}
}

func assertWordLayout(t *testing.T, got, want TextLayout) {
	t.Helper()
	if len(got.Chars) == 0 && len(want.Chars) == 0 {
		got.Chars, want.Chars = nil, nil
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got  %+v\nwant %+v", got, want)
	}
}

func XYWH(x, y, w, h int16) vmath.Box[int16] {
	return vmath.XYWH(x, y, w, h)
}
