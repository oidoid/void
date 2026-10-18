package vatlas

// 12b atlas animation ID (0..4095); upper four bits are reserved.
type Tag uint16

const MaxTags = 1 << 12
