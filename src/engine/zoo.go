package void

const maxSprites = 1024 * 1024

type Zoo struct {
	w, h    int
	sprites [maxSprites]Sprite
	vels    [maxSprites]Vel
	count   int
}

type Vel struct {
	X, Y float32
}

func (this *Zoo) SetSize(w, h int) {
	this.w = w
	this.h = h
}

func (this *Zoo) Update() {
	for i := range this.count {
		sprite := &this.sprites[i]
		vel := &this.vels[i]
		radius := float32(sprite.Radius)
		sprite.X += vel.X
		sprite.Y += vel.Y
		if sprite.X-radius < 0 {
			sprite.X = radius
			vel.X = -vel.X
		} else if sprite.X+radius > float32(this.w) {
			sprite.X = float32(this.w) - radius
			vel.X = -vel.X
		}
		if sprite.Y-radius < 0 {
			sprite.Y = radius
			vel.Y = -vel.Y
		} else if sprite.Y+radius > float32(this.h) {
			sprite.Y = float32(this.h) - radius
			vel.Y = -vel.Y
		}
	}
}

func (this *Zoo) DrawCircle(cx, cy float32, radius uint8, vx, vy float32, r, g, b, a uint8) {
	if this.count >= maxSprites {
		return
	}
	this.sprites[this.count] = Sprite{
		X: cx, Y: cy,
		Radius: radius,
		R:      r, G: g, B: b, A: a,
	}
	this.vels[this.count] = Vel{X: vx, Y: vy}
	this.count++
}
