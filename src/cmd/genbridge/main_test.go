package main

import (
	"bytes"
	"os"
	"testing"
)

func TestGeneratedBridge(t *testing.T) {
	got, err := os.ReadFile("../../void/vweb/eng/bridge.ts")
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, generate()) {
		t.Fatal("browser bridge is stale; run go generate ./src/void/veng")
	}
}
