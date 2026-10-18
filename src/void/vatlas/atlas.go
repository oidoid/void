package vatlas

// maximum total cels across all tags, including the nil cel.
const MaxAtlasCels = 65535

type Atlas struct {
	Meta []TagMeta // indexed by Tag.
	Cels []Cel
}

// assigns each tag its contiguous range of cels.
func NewAtlas(metas []TagMeta, cels []Cel) Atlas {
	if len(cels) > MaxAtlasCels {
		panic("atlas exceeds 65535 cels")
	}
	first := uint16(0)
	for i := range metas {
		metas[i].CelIndex = first
		first += uint16(metas[i].Cels)
	}
	return Atlas{Meta: metas, Cels: cels}
}

func (this *Atlas) Cel(tag Tag, cel uint8) Cel {
	return this.Cels[int(this.Meta[tag].CelIndex)+int(cel)]
}
