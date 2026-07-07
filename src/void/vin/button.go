package vin

type Button uint16

const (
	ButtonU Button = 1 << iota // up.
	ButtonD                    // down.
	ButtonL                    // left.
	ButtonR                    // right.
	ButtonA                    // primary.
	ButtonB                    // secondary.
	ButtonC                    // aux.
	ButtonMenu
	ButtonBack
	ButtonScaleInc
	ButtonScaleReset
	ButtonScaleDec
	// to-do: ButtonShift / ButtonMod
)
