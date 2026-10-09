package veng

import "testing"

func TestPollDeltaSecs(t *testing.T) {
	poll := Poll{DeltaMillis: 16.5}
	if got, want := poll.DeltaSecs(), .0165; got != want {
		t.Errorf("DeltaSecs() = %v, want %v", got, want)
	}
}
