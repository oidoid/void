package vinput

import "github.com/oidoid/void/src/void/vgeo"

// to-do: rename In and Game.In().
// to-do: per pad player assignment.
// to-do: offer prior device state too. there's no way to tell if a specific pad
// triggered.
// to-do: add void-js combo support.
type Input struct {
	Kbd   Keyboard  // all keyboards aggregated.
	Ptr   *Pointer  // primary pointer; nil if absent.
	Ptrs  []Pointer // all pointers including primary if exists; aggregate into on.
	Pads  []Gamepad // aggregated into on.
	Wheel Wheel     // wheel state; all wheels aggregated.

	Dir vgeo.XY[int8] // unit dir vector.

	On     Button
	PrevOn Button
	EverOn bool

	// true if any input changed this frame.
	Dirty bool

	// bitmask of buttons consumed this frame. all button test methods return
	// false for mask buttons. reset by `Update()`.
	Mask Button

	MinHeldMillis float64
	onChangedAt   float64 // time when On last changed.

	keyMap    [keyBits]Button
	clickMap  [clickBits]Button
	axisMap   [maxAxes][2]Button // [axis][sign].
	wheelMap  [2]Button          // [sign].
	buttonMap [gamepadButtonBits]Button
	textMap   map[rune]Button

	now      float64 // time of last update.
	prevCam  vgeo.Box[float32]
	prevPoll InputPoll
}

func NewInput() *Input {
	return &Input{MinHeldMillis: 300, textMap: make(map[rune]Button)}
}

// true if on hasn't changed in MinHeldAge ms.
func (this *Input) IsHeld() bool {
	return this.now-this.onChangedAt >= this.MinHeldMillis
}

// true if all buttons are off inclusively. eg, `IsOff(ButtonU)` is true when up
// is released or when up and down are released. updates mask if true.
func (this *Input) IsOff(btns Button) bool {
	ok := this.On&^this.Mask&btns == 0
	if ok {
		this.Mask |= btns
	}
	return ok
}

// true if all buttons are off inclusively and at least one of those buttons
// just turned off. eg, `IsOffStart(ButtonU)` is true when up is just released
// or when up is just released and down is released. updates mask if true.
func (this *Input) IsOffStart(btns Button) bool {
	ok := this.On&^this.Mask&btns == 0 && this.PrevOn&btns != 0
	if ok {
		this.Mask |= btns
	}
	return ok
}

// true if all buttons just became on from a fully off state. updates mask if true.
func (this *Input) IsOffEnd(btns Button) bool {
	ok := this.On&^this.Mask&btns == btns && this.PrevOn&btns == 0
	if ok {
		this.Mask |= btns
	}
	return ok
}

// true if all buttons are on inclusively. eg, `IsOn(ButtonU)` is true when up
// is pressed or when up and down are pressed. updates mask if true.
func (this *Input) IsOn(btns Button) bool {
	ok := this.On&^this.Mask&btns == btns
	if ok {
		this.Mask |= btns
	}
	return ok
}

// true if all buttons are on inclusively and at least one of those buttons
// just turned on. eg, `IsOnStart(ButtonU)` is true when up is just pressed or
// when up is just pressed and down is pressed. updates mask if true.
func (this *Input) IsOnStart(btns Button) bool {
	ok := this.On&^this.Mask&btns == btns && this.PrevOn&btns != btns
	if ok {
		this.Mask |= btns
	}
	return ok
}

// true if all buttons were on inclusively and at least one of those buttons
// just turned off. eg, `IsOnEnd(ButtonU)` is true when up is just released
// or when up is just released and down is released. updates mask if true.
func (this *Input) IsOnEnd(btns Button) bool {
	ok := this.On&^this.Mask&btns != btns && this.PrevOn&btns == btns
	if ok {
		this.Mask |= btns
	}
	return ok
}

// true if any button is on inclusively. eg, `IsAnyOn(ButtonU)` is true when up
// is pressed or when up and down are pressed. updates mask if true.
func (this *Input) IsAnyOn(btns Button) bool {
	ok := this.On&^this.Mask&btns != 0
	if ok {
		this.Mask |= btns
	}
	return ok
}

// true if any button is on inclusively and at least one of those buttons just
// turned on. eg, `IsAnyOnStart(ButtonU)` is true when up is just pressed or
// when up is just pressed and down is pressed. updates mask if true.
func (this *Input) IsAnyOnStart(btns Button) bool {
	ok := this.On&^this.Mask&^this.PrevOn&btns != 0
	if ok {
		this.Mask |= btns
	}
	return ok
}

// true if any button just turned off this frame. updates mask if true.
func (this *Input) IsAnyOnEnd(btns Button) bool {
	ok := this.PrevOn&^this.On&btns != 0
	if ok {
		this.Mask |= btns
	}
	return ok
}

// map each keyboard key to all buttons.
func (this *Input) MapKey(keys Key, btns Button) {
	for bit := range keyBits {
		if keys&(1<<bit) != 0 {
			this.keyMap[bit] = btns
		}
	}
}

// map each pointer button to all buttons.
func (this *Input) MapClick(clicks Click, btns Button) {
	for bit := range clickBits {
		if clicks&(1<<bit) != 0 {
			this.clickMap[bit] = btns
		}
	}
}

// map gamepad axis to negative and positive dir buttons.
func (this *Input) MapAxis(axis int, negBtns, posBtns Button) {
	this.axisMap[axis][0] = negBtns
	this.axisMap[axis][1] = posBtns
}

// map negative and positive wheel dir buttons.
func (this *Input) MapWheel(negBtns, posBtns Button) {
	this.wheelMap[0] = negBtns
	this.wheelMap[1] = posBtns
}

// map each gamepad button to all buttons.
func (this *Input) MapButton(padBtns GamepadButton, btns Button) {
	for bit := range gamepadButtonBits {
		if padBtns&(1<<bit) != 0 {
			this.buttonMap[bit] = btns
		}
	}
}

// map char to all buttons.
func (this *Input) MapText(ch rune, btns Button) {
	this.textMap[ch] = btns
}

func (this *Input) MapDefaults() {
	this.MapDefaultKeyboard()
	this.MapDefaultPointer()
	this.MapDefaultGamepad()
	this.MapDefaultText()
}

func (this *Input) MapDefaultText() {
	this.MapText('+', ButtonScaleInc)
	this.MapText('=', ButtonScaleReset)
	this.MapText('-', ButtonScaleDec)
}

func (this *Input) MapDefaultKeyboard() {
	this.MapKey(KeyUp, ButtonU)
	this.MapKey(KeyDown, ButtonD)
	this.MapKey(KeyLeft, ButtonL)
	this.MapKey(KeyRight, ButtonR)
	this.MapKey(KeyA, ButtonA)
	this.MapKey(KeyB, ButtonB)
	this.MapKey(KeyC, ButtonC)
	this.MapKey(KeyMenu, ButtonMenu)
	this.MapKey(KeyBack, ButtonBack)
}

func (this *Input) MapDefaultPointer() {
	this.MapClick(ClickPrimary, ButtonA)
	this.MapClick(ClickSecondary, ButtonB)
	this.MapClick(ClickAuxiliary, ButtonC)
	this.MapClick(ClickBack, ButtonBack)
}

func (this *Input) MapDefaultGamepad() {
	this.MapButton(GamepadButtonA, ButtonA) // cross.
	this.MapButton(GamepadButtonB, ButtonB) // circle.
	this.MapButton(GamepadButtonX, ButtonC) // square.
	this.MapButton(GamepadButtonStart, ButtonMenu)
	this.MapButton(GamepadButtonSelect, ButtonBack)
	this.MapButton(GamepadButtonUp, ButtonU)
	this.MapButton(GamepadButtonDown, ButtonD)
	this.MapButton(GamepadButtonLeft, ButtonL)
	this.MapButton(GamepadButtonRight, ButtonR)
	this.MapAxis(0, ButtonL, ButtonR) // left stick X.
	this.MapAxis(1, ButtonU, ButtonD) // left stick Y.
	this.MapAxis(2, ButtonL, ButtonR) // right stick X.
	this.MapAxis(3, ButtonU, ButtonD) // right stick Y.
}

func (this *Input) Reset(now float64) {
	this.Dirty = true
	this.Mask = 0
	this.PrevOn = 0
	this.Ptr = nil
	this.Ptrs = this.Ptrs[:0]
	this.Pads = this.Pads[:0]
	this.Kbd = Keyboard{}
	this.Wheel = Wheel{}

	this.On = 0
	this.onChangedAt = now
	this.now = now
	this.prevCam = vgeo.Box[float32]{}

	this.Dir = vgeo.XY[int8]{}
}

func (this *Input) Update(now float64, poll *InputPoll, cam vgeo.Box[float32]) {
	if poll == nil {
		poll = &InputPoll{}
	}

	this.Mask = 0
	this.Dirty = false
	this.PrevOn = this.On
	this.now = now
	this.Ptr = nil
	this.Ptrs = this.Ptrs[:0]
	this.Pads = this.Pads[:0]

	this.On = this.evalOn(poll)
	if this.On != 0 {
		this.EverOn = true
	}
	if this.On != this.PrevOn {
		this.onChangedAt = now
	}

	this.Dirty = cam != this.prevCam || !inputEq(poll, &this.prevPoll)
	this.prevPoll = *poll
	this.prevCam = cam

	this.Dir = vgeo.XY[int8]{}
	if this.On&ButtonR != 0 {
		this.Dir.X++
	}
	if this.On&ButtonL != 0 {
		this.Dir.X--
	}
	if this.On&ButtonD != 0 {
		this.Dir.Y++
	}
	if this.On&ButtonU != 0 {
		this.Dir.Y--
	}

	this.Kbd = Keyboard{
		Keys:         poll.Kbd.Keys,
		Text:         string(poll.Kbd.Text[:poll.Kbd.TextLen]),
		TextOverflow: poll.Kbd.TextOverflow,
	}
	this.Wheel = Wheel{WheelPoll: poll.Wheel}
	for i := range poll.PtrsLen {
		this.Ptrs = append(this.Ptrs, newPointer(poll.Ptrs[i], cam.Min))
	}
	if len(this.Ptrs) > 0 {
		this.Ptr = &this.Ptrs[0]
	}
	for i := range poll.PadsLen {
		pad := &poll.Pads[i]
		this.Pads = append(this.Pads, Gamepad{GamepadPoll: *pad})
	}
}

func (this *Input) evalOn(poll *InputPoll) Button {
	var on Button

	keys := poll.Kbd.Keys
	for bit := range keyBits {
		if keys&(1<<bit) != 0 {
			on |= this.keyMap[bit]
		}
	}

	for i := range poll.PtrsLen {
		clicks := poll.Ptrs[i].Clicks
		for bit := range clickBits {
			if clicks&(1<<bit) != 0 {
				on |= this.clickMap[bit]
			}
		}
	}

	for i := range poll.PadsLen {
		pad := &poll.Pads[i]
		btns := pad.Buttons
		for bit := range gamepadButtonBits {
			if btns&GamepadButton(1<<bit) != 0 {
				on |= this.buttonMap[bit]
			}
		}
		for axis := range maxAxes {
			v := pad.Axes[axis]
			if v < -0.5 {
				on |= this.axisMap[axis][0]
			} else if v > 0.5 {
				on |= this.axisMap[axis][1]
			}
		}
	}

	wheelD := poll.Wheel.Delta.Y
	if wheelD < 0 {
		on |= this.wheelMap[0]
	} else if wheelD > 0 {
		on |= this.wheelMap[1]
	}

	kbd := &poll.Kbd
	if kbd.TextLen > 0 {
		for _, ch := range string(kbd.Text[:kbd.TextLen]) {
			on |= this.textMap[ch]
		}
	}

	return on
}

func inputEq(l, r *InputPoll) bool {
	if l.PtrsLen != r.PtrsLen || l.PadsLen != r.PadsLen {
		return false
	}

	// manually implement `PointerPoll` and `GamepadPoll` equality to skip heavy
	// fat costs.
	for i := range l.PtrsLen {
		if l.Ptrs[i] != r.Ptrs[i] {
			return false
		}
	}
	for i := range l.PadsLen {
		if l.Pads[i] != r.Pads[i] {
			return false
		}
	}

	return keyboardPollEq(&l.Kbd, &r.Kbd) && l.Wheel == r.Wheel
}

func keyboardPollEq(l, r *KeyboardPoll) bool {
	if l.Keys != r.Keys ||
		l.TextLen != r.TextLen ||
		l.TextOverflow != r.TextOverflow {
		return false
	}
	// hack: Text comparisons crash or hang compiler.
	for i := range l.TextLen {
		if l.Text[i] != r.Text[i] {
			return false
		}
	}
	return true
}
