package main

import "testing"

func TestGenBin(t *testing.T) {
	got, err := genBin("assets", []byte{0, 1, 255})
	if err != nil {
		t.Fatal(err)
	}
	want := `// codegen by packatlas.
package assets

var AtlasBin = []byte{
	0x00, 0x01, 0xff,
}
`
	if string(got) != want {
		t.Fatalf("generated source:\n%s\nwant:\n%s", got, want)
	}
}

func TestGenTags(t *testing.T) {
	got, err := genTags("tags", []stemTag{
		{stem: "ui", tag: "idle"},
		{stem: "player", tag: "run"},
	})
	if err != nil {
		t.Fatal(err)
	}
	want := `// codegen by packatlas.
package tags

import "github.com/oidoid/void/src/void/vatlas"

const (
	UIIdle vatlas.Tag = iota
	PlayerRun
)
`
	if string(got) != want {
		t.Fatalf("generated source:\n%s\nwant:\n%s", got, want)
	}
}
