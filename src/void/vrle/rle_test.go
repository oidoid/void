package vrle

import (
	"reflect"
	"testing"
)

func TestRLEEncode_empty(t *testing.T) {
	got := Encode[uint16, uint16](nil)
	if len(got) != 0 {
		t.Fatalf("got %v, want empty", got)
	}
}

func TestRLEEncode_single(t *testing.T) {
	got := Encode[uint16, uint16]([]uint16{7})
	want := []Pair[uint16, uint16]{{Val: 7, Count: 1}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestRLEEncode_allSame(t *testing.T) {
	got := Encode[uint16, uint16]([]uint16{3, 3, 3})
	want := []Pair[uint16, uint16]{{Val: 3, Count: 3}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestRLEEncode_allDifferent(t *testing.T) {
	got := Encode[uint16, uint16]([]uint16{1, 2, 3})
	want := []Pair[uint16, uint16]{{1, 1}, {2, 1}, {3, 1}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestRLEEncode_mixed(t *testing.T) {
	got := Encode[uint16, uint16]([]uint16{1, 1, 2, 3, 3, 3})
	want := []Pair[uint16, uint16]{{1, 2}, {2, 1}, {3, 3}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestRLEEncode_countSaturation(t *testing.T) {
	// uint8 max is 255; 256 identical values should produce two pairs.
	vals := make([]uint16, 256)
	for i := range vals {
		vals[i] = 9
	}
	got := Encode[uint16, uint8](vals)
	want := []Pair[uint16, uint8]{{Val: 9, Count: 255}, {Val: 9, Count: 1}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestRLEEncode_strings(t *testing.T) {
	got := Encode[string, uint8]([]string{"a", "a", "b"})
	want := []Pair[string, uint8]{{"a", 2}, {"b", 1}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}
