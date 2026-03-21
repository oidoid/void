package void

type Void struct {
	x float32
}

var _ WASMAPI = (*Void)(nil)

func (v *Void) Update() {
	println("hello from Go engine %d", v.x)
}
