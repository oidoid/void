package gfx

import (
	"encoding/json"
	"os"
	"reflect"
	"strconv"
	"testing"

	"github.com/oidoid/void/src/demo/tags"
	"github.com/oidoid/void/src/void/vatlas"
	"github.com/oidoid/void/src/void/vgfx"
)

func TestTiledSpawnEnums(t *testing.T) {
	bin, err := os.ReadFile("../assets/boards/boards.tiled-project")
	if err != nil {
		t.Fatal(err)
	}
	project := struct {
		PropertyTypes []struct {
			Name        string   `json:"name"`
			StorageType string   `json:"storageType"`
			Type        string   `json:"type"`
			Values      []string `json:"values"`
		} `json:"propertyTypes"`
	}{}
	if err := json.Unmarshal(bin, &project); err != nil {
		t.Fatal(err)
	}

	want := map[string][]string{
		"Layer": {
			"Tiles", "P1", "Superballs", "UI", "ViewportEdge", "Cursor",
			"Overlay", "Grid",
		},
		"Cel": make([]string, int(vatlas.TagCelMask)+1),
		"Z":   make([]string, vgfx.SublayerCount),
		"Pal": {
			"Default", "Widget", "WidgetFocused", "WidgetOn",
			"WidgetFocusedOn", "Text", "TextLight",
		},
	}
	for _, name := range [...]string{"Cel", "Z"} {
		for i := range want[name] {
			want[name][i] = strconv.Itoa(i)
		}
	}
	if len(want["Layer"]) != vgfx.LayerCount {
		t.Fatalf("Layer enum has %d values, engine has %d layers",
			len(want["Layer"]), vgfx.LayerCount)
	}
	palTags := [...]vatlas.Tag{
		0, tags.PalWidget, tags.PalWidgetFocused, tags.PalWidgetOn,
		tags.PalWidgetFocusedOn, tags.PalText, tags.PalTextLight,
	}
	for i, tag := range palTags {
		if tag != vatlas.Tag(i) {
			t.Fatalf("Pal enum index %d has tag %d", i, tag)
		}
	}
	for _, propType := range project.PropertyTypes {
		wantValues, ok := want[propType.Name]
		if !ok {
			continue
		}
		if propType.Type != "enum" || propType.StorageType != "int" {
			t.Errorf("%s type = %q/%q, want enum/int", propType.Name,
				propType.Type, propType.StorageType)
		}
		if !reflect.DeepEqual(propType.Values, wantValues) {
			t.Errorf("%s values = %v, want %v", propType.Name,
				propType.Values, wantValues)
		}
		delete(want, propType.Name)
	}
	for name := range want {
		t.Errorf("missing %s enum", name)
	}
}
