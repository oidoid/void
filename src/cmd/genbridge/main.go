// generates TypeScript ABI from `bridge.tstmpl`.
package main

import (
	"bytes"
	_ "embed"
	"fmt"
	"os"
	"reflect"
	"strings"
	"text/template"

	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/veng"
	"github.com/oidoid/void/src/void/vgfx"
	"github.com/oidoid/void/src/void/vin"
)

//go:embed bridge.tstmpl
var bridgeTemplSrc string

var bridgeTempl = template.
	Must(template.New("bridge.tstmpl").
		Option("missingkey=error").
		Funcs(template.FuncMap{"offset": offset, "fields": fields}).
		Parse(bridgeTemplSrc))

func main() {
	if len(os.Args) != 2 {
		panic("usage: genbridge <bridge.ts>")
	}
	if err := os.WriteFile(os.Args[1], generate(), 0o644); err != nil {
		panic(err)
	}
}

func generate() []byte {
	data := map[string]any{
		"TagMeta":                  reflect.TypeFor[vatlas.TagMeta](),
		"AtlasCel":                 reflect.TypeFor[vatlas.Cel](),
		"PtrPoll":                  reflect.TypeFor[vin.PtrPoll](),
		"GamepadPoll":              reflect.TypeFor[vin.GamepadPoll](),
		"Poll":                     reflect.TypeFor[veng.Poll](),
		"WheelPoll":                reflect.TypeFor[vin.WheelPoll](),
		"Float32":                  reflect.TypeFor[float32](),
		"Out":                      reflect.TypeFor[veng.Out](),
		"Beep":                     reflect.TypeFor[veng.Beep](),
		"Spr":                      reflect.TypeFor[vgfx.Spr](),
		"LayerConfigExport":        reflect.TypeFor[vgfx.LayerConfigExport](),
		"MaxPtrs":                  vin.MaxPtrs,
		"MaxGamepads":              vin.MaxGamepads,
		"MaxTextLen":               vin.MaxTextLen,
		"KeyUp":                    vin.KeyUp,
		"KeyDown":                  vin.KeyDown,
		"KeyLeft":                  vin.KeyLeft,
		"KeyRight":                 vin.KeyRight,
		"KeyA":                     vin.KeyA,
		"KeyB":                     vin.KeyB,
		"KeyC":                     vin.KeyC,
		"KeyMenu":                  vin.KeyMenu,
		"KeyBack":                  vin.KeyBack,
		"PtrDevUnknown":            vin.PtrDevUnknown,
		"PtrDevMouse":              vin.PtrDevMouse,
		"PtrDevPen":                vin.PtrDevPen,
		"PtrDevTouch":              vin.PtrDevTouch,
		"OutReqMask":               veng.OutReqMask,
		"OutReqScreenshotShift":    veng.OutReqScreenshotShift,
		"OutReqContextLossShift":   veng.OutReqContextLossShift,
		"SprStride":                vgfx.SprStride,
		"LayerCount":               vgfx.LayerCount,
		"LayerFlagsDepthShift":     vgfx.LayerFlagsDepthShift,
		"LayerFlagsDepthFlag":      vgfx.LayerFlagsDepthFlag,
		"LayerFlagsDepthMask":      vgfx.LayerFlagsDepthMask,
		"LayerFlagsBlendModeShift": vgfx.LayerFlagsBlendModeShift,
		"LayerFlagsBlendModeMask":  vgfx.LayerFlagsBlendModeMask,
		"LayerCamModeApply":        vgfx.LayerCamModeApply,
		"LayerCamModeFixed":        vgfx.LayerCamModeFixed,
		"LayerBlendModeAlpha":      vgfx.LayerBlendModeAlpha,
		"LayerBlendModeMultiply":   vgfx.LayerBlendModeMultiply,
		"LayerBlendModeReplace":    vgfx.LayerBlendModeReplace,
		"ShaderTiles":              vgfx.ShaderTiles,
		"ShaderSprs":               vgfx.ShaderSprs,
		"ShaderOverlay":            vgfx.ShaderOverlay,
		"Pause":                    veng.Pause,
		"Loop":                     veng.Loop,
		"RenderModeFloat":          vgfx.RenderModeFloat,
		"RenderModePixel":          vgfx.RenderModePixel,
		"FullscreenReqNone":        veng.FullscreenReqNone,
		"FullscreenReqExit":        veng.FullscreenReqExit,
		"FullscreenReqEnter":       veng.FullscreenReqEnter,
		"FullscreenReqPortrait":    veng.FullscreenReqPortrait,
		"FullscreenReqLandscape":   veng.FullscreenReqLandscape,
	}
	var out bytes.Buffer
	if err := bridgeTempl.Execute(&out, data); err != nil {
		panic(err)
	}
	return out.Bytes()
}

// returns fields in declaration order, excluding `_` pad fields.
func fields(typ reflect.Type) []reflect.StructField {
	fields := make([]reflect.StructField, 0, typ.NumField())
	for i := 0; i < typ.NumField(); i++ {
		field := typ.Field(i)
		if field.Name != "_" {
			fields = append(fields, field)
		}
	}
	return fields
}

func offset(typ reflect.Type, path string) (uintptr, error) {
	var result uintptr
	for name := range strings.SplitSeq(path, ".") {
		field, ok := typ.FieldByName(name)
		if !ok {
			return 0, fmt.Errorf("%s has no field %s", typ, name)
		}
		result += field.Offset
		typ = field.Type
	}
	return result, nil
}
