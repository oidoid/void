package vatlas

// hi 12b is `AnimID`, lo 4b is cel.
type AnimCel uint16

const AnimCelShift = 4
const AnimCelMask AnimCel = 0xf
