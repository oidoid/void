package void

type Void struct {
	x float32
}

func (v *Void) Hello() {
	println("hello from Go engine %d", v.x)
}
