package main

import (
	"fmt"
	"image"
	"path/filepath"
	"strconv"
	"strings"
	"unicode"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmath"
)

// max width of palette.
const maxPalColors = 256

// max ID of palette.
const maxPalAnimID = 0xff

const atlasRowWidth = 4096

var nilKey = stemTag{stem: "void", tag: "Nil"}

type rawFrame struct {
	pxs []byte // full asset image.
	pal []vatlas.AseRGBA
}

// maps unique base palette RGBA to palette slots (horizontal offsets). target
// palettes may repeat colors, but base colors must be unique and have nonzero
// alpha.
type baseColorSlots map[vatlas.AseRGBA]byte

// assets that use a palette. maps each swappable asset to its base-color slots.
type slotsByAsset map[*asset]baseColorSlots

// assets that provide a palette.
type palAssets map[*asset]bool

type stemTag struct {
	// source basename without extension (qualifier); eg, `widget` or `void`.
	stem string
	tag  string // unqualified Aseprite animation tag; eg, `EdgeLight` or `Nil`.
}

func (this stemTag) qualifiedTag() string {
	return nameToIdent(this.stem) + nameToIdent(this.tag)
}

type anim struct {
	stemTag stemTag
	asset   *asset
	tagSpan assetTagSpan
}

// palette-swapped assets encode their color slot in R, G and B are zero, and A
// is opaque (do not discard in shader). other assets just use RGBA pixels.
type swappedFrame = []byte

type swappedAnim struct {
	vatlas.Anim
	stemTag stemTag
	frames  []swappedFrame
}

type placedCel struct {
	pxs  []byte
	w, h uint16
	xy   vgeo.XY[uint16]
}

// to-do: skyline
// bin packs distinct cels.
func placeCels(
	anims []swappedAnim,
) (cels []placedCel, celXY []uint16, height int, err error) {
	type celKey struct {
		w, h uint16
		px   string
	}
	places := map[celKey]vgeo.XY[uint16]{}
	x, y, rowH := 0, 0, 0
	for _, anim := range anims {
		for _, frame := range anim.frames {
			k := celKey{w: anim.W, h: anim.H, px: string(frame)}
			xy, ok := places[k]
			if !ok {
				if int(anim.W) > atlasRowWidth {
					return nil, nil, 0, fmt.Errorf(
						"cel width %d exceeds atlas row width", anim.W,
					)
				}
				if x+int(anim.W) > atlasRowWidth {
					x = 0
					y += rowH
					rowH = 0
				}
				xy = vgeo.NewXY(uint16(x), uint16(y))
				places[k] = xy
				cels = append(cels, placedCel{
					pxs: frame, w: anim.W, h: anim.H, xy: xy,
				})
				x += int(anim.W)
				rowH = max(rowH, int(anim.H))
			}
			celXY = append(celXY, xy.X, xy.Y)
		}
	}
	height = y + rowH
	if height == 0 {
		height = 1
	}
	if height > 65535 {
		return nil, nil, 0, fmt.Errorf("atlas height %d exceeds uint16", height)
	}
	return
}

// collects uniquely keyed animation tags from assets.
func filterAnims(assets []*asset) (anims []anim, err error) {
	seen := map[stemTag]bool{nilKey: true}
	for _, asset := range assets {
		stem := strings.TrimSuffix(
			filepath.Base(asset.name), filepath.Ext(asset.name),
		)
		for _, tag := range asset.TagSpans {
			k := stemTag{stem: stem, tag: tag.Name}
			if seen[k] {
				return nil, fmt.Errorf("atlas tag %q duplicate", k.qualifiedTag())
			}
			seen[k] = true
			anims = append(anims, anim{stemTag: k, asset: asset, tagSpan: tag})
		}
	}
	return
}

// resolves base-color slots and palette assets for swappable animations.
func computePalettes(
	anims []anim,
) (slotsByAsset, palAssets, error) {
	slotsByAsset := slotsByAsset{}
	// caches base-color-to-slot maps by base palette animation.
	slotsByBasePal := map[stemTag]baseColorSlots{}
	palAssets := palAssets{}
	for _, anim := range anims {
		if anim.asset.Data == nil || anim.asset.Data.Pal == "" {
			continue
		}
		if _, exists := slotsByAsset[anim.asset]; exists {
			continue
		}
		base, err := findBasePal(anims, anim.asset.Data.Pal)
		if err != nil {
			return nil, nil, fmt.Errorf("%s: %w",
				anim.stemTag.qualifiedTag(), err)
		}
		slots, ok := slotsByBasePal[base.stemTag]
		if !ok {
			frames, err := parseFrames(base.asset, base.tagSpan)
			if err != nil {
				return nil, nil, fmt.Errorf("%s %s: %w",
					base.asset.name, base.tagSpan.Name, err)
			}
			slots, err = mapBaseColorSlots(base.stemTag, base.asset, frames)
			if err != nil {
				return nil, nil, fmt.Errorf("%s: %w",
					anim.stemTag.qualifiedTag(), err)
			}
			slotsByBasePal[base.stemTag] = slots
		}
		slotsByAsset[anim.asset] = slots
		palAssets[base.asset] = true
	}
	return slotsByAsset, palAssets, nil
}

// orders palette-source tags before ordinary animation tags.
func sortAnims(anims []anim, palAssets palAssets) ([]anim, error) {
	pals := make([]anim, 0)
	rest := make([]anim, 0)
	for _, anim := range anims {
		if palAssets[anim.asset] {
			pals = append(pals, anim)
		} else {
			rest = append(rest, anim)
		}
	}
	if len(pals) > maxPalAnimID {
		return nil, fmt.Errorf(
			"palette animation count %d exceeds %d", len(pals), maxPalAnimID,
		)
	}
	return append(pals, rest...), nil
}

// encodes each referenced tag into an atlas animation.
func swapAnims(
	anims []anim,
	slotsByAsset slotsByAsset,
) ([]swappedAnim, error) {
	swappedAnims := []swappedAnim{{
		Anim:    vatlas.Anim{Cels: 1, W: 1, H: 1},
		stemTag: nilKey,
		frames:  []swappedFrame{make([]byte, 4)},
	}}
	for _, anim := range anims {
		frames, err := parseFrames(anim.asset, anim.tagSpan)
		if err != nil {
			return nil, fmt.Errorf("%s %s: %w",
				anim.asset.name, anim.tagSpan.Name, err)
		}
		hitbox, hurtbox, err := parseBoxes(anim.asset, anim.tagSpan.Name)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", anim.asset.name, err)
		}
		w, h := anim.asset.W, anim.asset.H
		slots, swapped := slotsByAsset[anim.asset]
		swappedFrames := make([]swappedFrame, len(frames))
		if swapped {
			swappedFrames, err = swapFrames(
				anim.stemTag, anim.asset, frames, slots,
			)
			if err != nil {
				return nil, err
			}
		} else {
			for i, frame := range frames {
				swappedFrames[i] = serializeFrame(anim.asset, frame)
			}
		}
		swappedAnims = append(swappedAnims, swappedAnim{
			Anim: vatlas.Anim{
				Cels:    uint8(len(swappedFrames)),
				W:       w,
				H:       h,
				Hitbox:  hitbox,
				Hurtbox: hurtbox,
			},
			stemTag: anim.stemTag,
			frames:  swappedFrames,
		})
	}
	return swappedAnims, nil
}

// packs embedded native tiles in contiguous source tile-ID order.
func packTiles(
	assets []*asset,
) (packed []swappedAnim, err error) {
	for _, asset := range assets {
		stem := strings.TrimSuffix(
			filepath.Base(asset.name), filepath.Ext(asset.name),
		)
		for _, tileset := range asset.Tilesets {
			flags := tileset.Header.Flags
			if flags>>vatlas.AseTilesetEmbeddedShift&
				vatlas.AseTilesetEmbeddedMask == 0 {
				return nil, fmt.Errorf(
					"%s: tileset %q has no embedded image",
					asset.name, tileset.Name,
				)
			}
			tilePxLen := uint64(tileset.Header.W) * uint64(tileset.Header.H) *
				uint64(asset.ColorDepth/8)
			pxLen := tilePxLen * uint64(tileset.Header.Count)
			if uint64(len(tileset.Pxs)) != pxLen {
				return nil, fmt.Errorf(
					"%s: tileset %q has %d pixel bytes, want %d",
					asset.name, tileset.Name, len(tileset.Pxs), pxLen,
				)
			}
			if tilePxLen > uint64(^uint(0)>>1) {
				return nil, fmt.Errorf(
					"%s: tileset %q tiles are too large", asset.name, tileset.Name,
				)
			}
			pal := []vatlas.AseRGBA(nil)
			if len(asset.Frames) != 0 {
				pal = asset.Frames[0].Pal
			}
			tileLen := int(tilePxLen)
			for tileID := range tileset.Header.Count {
				from := int(tileID) * tileLen
				frame := rawFrame{pxs: tileset.Pxs[from : from+tileLen], pal: pal}
				tag := strconv.FormatUint(uint64(tileID), 10)
				if len(asset.Tilesets) > 1 {
					tag = fmt.Sprintf("tileset-%d-tile-%d", tileset.Header.ID, tileID)
				}
				key := stemTag{stem: stem, tag: tag}
				packed = append(packed, swappedAnim{
					Anim: vatlas.Anim{
						Cels: 1, W: tileset.Header.W, H: tileset.Header.H,
					},
					stemTag: key,
					frames:  []swappedFrame{serializeFrame(asset, frame)},
				})
			}
		}
	}
	return packed, nil
}

// finds an unqualified base palette tag.
func findBasePal(anims []anim, tag string) (anim, error) {
	var found anim
	for _, ref := range anims {
		if ref.asset.Data != nil && ref.asset.Data.Pal != "" {
			// asset is known to require a palette not be a palette.
			continue
		}
		if ref.stemTag.tag != tag {
			continue
		}
		if found.asset != nil {
			return anim{}, fmt.Errorf("pal %q is ambiguous", tag)
		}
		found = ref
	}
	if found.asset == nil {
		return anim{}, fmt.Errorf("pal %q not found", tag)
	}
	return found, nil
}

// builds a base-color-to-slot lookup from a uniquely colored base strip.
func mapBaseColorSlots(
	k stemTag,
	asset *asset,
	frames []rawFrame,
) (baseColorSlots, error) {
	if asset.ColorDepth != vatlas.AseColorIndexed {
		return nil, fmt.Errorf("pal %q must be indexed", k.qualifiedTag())
	}
	if len(frames) == 0 || asset.H != 1 || asset.W > maxPalColors {
		return nil, fmt.Errorf(
			"pal %q must be a 1px-high strip no wider than %d",
			k.qualifiedTag(), maxPalColors,
		)
	}
	slots := baseColorSlots{}
	for slot, entry := range frames[0].pxs {
		baseColor := frames[0].pal[entry]
		if entry == asset.TransparentIndex || baseColor.A == 0 {
			continue
		}
		if prior, exists := slots[baseColor]; exists {
			return nil, fmt.Errorf(
				"pal %q repeats base color at slots %d and %d",
				k.qualifiedTag(), prior, slot,
			)
		}
		slots[baseColor] = byte(slot)
	}
	return slots, nil
}

// encodes indexed frames as palette-slot pixels.
func swapFrames(
	tag stemTag,
	asset *asset,
	frames []rawFrame,
	slots baseColorSlots,
) (swapped []swappedFrame, err error) {
	if asset.ColorDepth != vatlas.AseColorIndexed {
		return nil, fmt.Errorf(
			"%s: pal-swappable assets must be indexed", tag.qualifiedTag(),
		)
	}
	for _, frame := range frames {
		rgba := make([]byte, len(frame.pxs)*4)
		for p, entry := range frame.pxs {
			if entry == asset.TransparentIndex {
				continue
			}
			sourceColor := frame.pal[entry]
			slot, ok := slots[sourceColor]
			if !ok {
				return nil, fmt.Errorf(
					"%s: source color is absent from base colors",
					tag.qualifiedTag(),
				)
			}
			rgba[p*4] = slot
			rgba[p*4+3] = 255 // prevent shader discard.
		}
		swapped = append(swapped, rgba)
	}
	return
}

// expands a composed source frame to ordinary RGBA pixels.
func serializeFrame(asset *asset, frame rawFrame) []byte {
	if asset.ColorDepth == vatlas.AseColorRGBA {
		return frame.pxs
	}
	rgba := make([]byte, len(frame.pxs)*4)
	for i, entry := range frame.pxs {
		if entry == asset.TransparentIndex {
			continue
		}
		color := frame.pal[entry]
		rgba[i*4+0], rgba[i*4+1], rgba[i*4+2], rgba[i*4+3] =
			color.R, color.G, color.B, color.A
	}
	return rgba
}

// expands a tag to one animation period. each nonzero duration frame is
// guaranteed to appear for at least `CelMillis`. cels are duplicated until cel
// duration is at least met; cels are unpacked until a full period is defined
// for the dir. no warns for overflowing past.
func parseFrames(
	asset *asset,
	tagSpan assetTagSpan,
) (frames []rawFrame, err error) {
	from, to := int(tagSpan.Header.From), int(tagSpan.Header.To)
	if from > to || to >= len(asset.Frames) {
		return nil, fmt.Errorf("invalid frame range %d..%d", from, to)
	}
	period := framePeriod(tagSpan)
	millis := 0
	for i := 0; i < period &&
		len(frames) < vatlas.CelsPerAnim &&
		millis < vatlas.MaxAnimLoopMillis; i++ {
		frameI := frameIndex(tagSpan, i)
		raw, err := composeFrame(asset, frameI)
		if err != nil {
			return nil, err
		}
		for celMillis := 0; celMillis < int(asset.Frames[frameI].Millis) &&
			len(frames) < vatlas.CelsPerAnim &&
			millis < vatlas.MaxAnimLoopMillis; celMillis += vatlas.CelMillis {
			millis += vatlas.CelMillis
			frames = append(frames, rawFrame{pxs: raw, pal: asset.Frames[frameI].Pal})
			if from == to {
				return frames, nil
			}
		}
	}
	if len(frames) == 0 {
		return nil, fmt.Errorf("animation has no cels")
	}
	return
}

// renders visible normal layers into one asset frame.
func composeFrame(asset *asset, frameI int) ([]byte, error) {
	bpp := int(asset.ColorDepth / 8)
	out := make([]byte, int(asset.W)*int(asset.H)*bpp)
	if asset.ColorDepth == vatlas.AseColorIndexed {
		for i := range out {
			out[i] = asset.TransparentIndex
		}
	}
	for layerI, assetLayer := range asset.Layers {
		visible := assetLayer.Header.Flags>>vatlas.AseLayerVisibleShift&
			vatlas.AseLayerVisibleMask != 0
		if !visible || assetLayer.Header.Type != vatlas.AseLayerNormal {
			continue
		}
		cel, ok := findLayerCel(asset, frameI, uint16(layerI))
		if !ok {
			continue
		}
		if assetLayer.Header.Blend != 0 ||
			assetLayer.Header.Opacity != 255 ||
			cel.Header.Opacity != 255 {
			return nil, fmt.Errorf(
				"frame %d assetLayer %q uses unsupported blend or opacity",
				frameI, assetLayer.Name,
			)
		}
		for y := 0; y < int(cel.Image.H); y++ {
			for x := 0; x < int(cel.Image.W); x++ {
				dx, dy := int(cel.Header.X)+x, int(cel.Header.Y)+y
				if dx < 0 || dy < 0 || dx >= int(asset.W) || dy >= int(asset.H) {
					continue
				}
				srcI := (y*int(cel.Image.W) + x) * bpp
				dstI := (dy*int(asset.W) + dx) * bpp
				if asset.ColorDepth == vatlas.AseColorIndexed {
					i := cel.Pxs[srcI]
					// fully transparent pixels leave lower layers intact.
					if i != asset.TransparentIndex &&
						asset.Frames[frameI].Pal[i].A != 0 {
						out[dstI] = i
					}
				} else if cel.Pxs[srcI+3] != 0 {
					copy(out[dstI:dstI+4], cel.Pxs[srcI:srcI+4])
				}
			}
		}
	}
	return out, nil
}

// builds the texture, runtime atlas, and generated animation keys.
func parseAtlas(
	assets []*asset,
) (*image.NRGBA, *vatlas.Atlas, []stemTag, error) {
	assetAnims, err := filterAnims(assets)
	if err != nil {
		return nil, nil, nil, err
	}
	slotsByAsset, isPal, err := computePalettes(assetAnims)
	if err != nil {
		return nil, nil, nil, err
	}
	assetAnims, err = sortAnims(assetAnims, isPal)
	if err != nil {
		return nil, nil, nil, err
	}
	packed, err := swapAnims(assetAnims, slotsByAsset)
	if err != nil {
		return nil, nil, nil, err
	}
	tiles, err := packTiles(assets)
	if err != nil {
		return nil, nil, nil, err
	}
	packed = append(packed, tiles...)
	cels, celXY, height, err := placeCels(packed)
	if err != nil {
		return nil, nil, nil, err
	}
	img := draw(cels, height)
	anims := make([]vatlas.Anim, len(packed))
	tags := make([]stemTag, len(packed))
	for i, anim := range packed {
		anims[i] = anim.Anim
		tags[i] = anim.stemTag
	}
	atlas := vatlas.NewAtlas(anims, celXY)
	return img, &atlas, tags, nil
}

func draw(cels []placedCel, height int) *image.NRGBA {
	img := image.NewNRGBA(image.Rect(0, 0, atlasRowWidth, height))
	for _, cel := range cels {
		rowBytes := int(cel.w) * 4
		for row := range int(cel.h) {
			dst := img.Pix[(int(cel.xy.Y)+row)*img.Stride+int(cel.xy.X)*4:]
			src := cel.pxs[row*rowBytes:]
			copy(dst, src[:rowBytes])
		}
	}
	return img
}

// returns the number of source-frame positions in one tag loop.
func framePeriod(tagSpan assetTagSpan) int {
	frameLen := int(tagSpan.Header.To) - int(tagSpan.Header.From) + 1
	if tagSpan.Header.Direction == vatlas.AseDirPingPong ||
		tagSpan.Header.Direction == vatlas.AseDirPingPongReverse {
		return max(1, 2*(frameLen-1))
	}
	return frameLen
}

// returns the source frame for a tag cycle position.
func frameIndex(tagSpan assetTagSpan, i int) int {
	from, to := int(tagSpan.Header.From), int(tagSpan.Header.To)
	peak := to - from
	i %= framePeriod(tagSpan)
	switch tagSpan.Header.Direction {
	case vatlas.AseDirReverse:
		return to - i
	case vatlas.AseDirPingPong:
		return from + peak - vmath.Abs(i-peak)
	case vatlas.AseDirPingPongReverse:
		return to - (peak - vmath.Abs(i-peak))
	default:
		return from + i
	}
}

// returns a assetLayer cel through linked source frames. false if the cel is absent
// or the link is invalid.
func findLayerCel(asset *asset, frameI int, assetLayer uint16) (assetCel, bool) {
	cel, ok := asset.Frames[frameI].Cels[assetLayer]
	if !ok {
		return assetCel{}, false
	}
	for cel.LinkedFrame >= 0 {
		if cel.LinkedFrame >= len(asset.Frames) {
			return assetCel{}, false
		}
		var linked bool
		cel, linked = asset.Frames[cel.LinkedFrame].Cels[assetLayer]
		if !linked {
			return assetCel{}, false
		}
	}
	return cel, true
}

func parseBoxes(
	asset *asset,
	tag string,
) (hit, hurt vgeo.Box[uint16], err error) {
	for _, assetSlice := range asset.Slices {
		if assetSlice.Name != tag || len(assetSlice.Keys) == 0 {
			continue
		}
		first := assetSlice.Keys[0].Header.Bounds
		for _, key := range assetSlice.Keys {
			if key.Header.Bounds != first {
				return hit, hurt, fmt.Errorf(
					"atlas tag %q hitbox bounds varies across frames", tag,
				)
			}
		}
		box := vgeo.XYWH(
			uint16(first.X), uint16(first.Y),
			uint16(first.W), uint16(first.H),
		)
		switch assetSlice.RGBA {
		case vatlas.AseRGBA{R: 255, A: 255}:
			hit = box
		case vatlas.AseRGBA{G: 255, A: 255}:
			hurt = box
		case vatlas.AseRGBA{B: 255, A: 255}:
			hit, hurt = box, box
		default:
			return hit, hurt, fmt.Errorf("atlas tag %q hitbox color unsupported", tag)
		}
	}
	return
}

// converts a hyphenated asset name to a Go identifier.
func nameToIdent(name string) string {
	var str strings.Builder
	for _, seg := range strings.Split(name, "-") {
		if seg == "" {
			continue
		}
		upper := strings.ToUpper(seg)
		if initialisms[upper] {
			str.WriteString(upper)
		} else {
			chars := []rune(seg)
			str.WriteRune(unicode.ToUpper(chars[0]))
			str.WriteString(string(chars[1:]))
		}
	}
	return str.String()
}
