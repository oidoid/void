package main

import (
	"io"
)

type filesizeWriter struct{ n int64 }

var _ io.Writer = (*filesizeWriter)(nil)

func (this *filesizeWriter) Write(bytes []byte) (int, error) {
	this.n += int64(len(bytes))
	return len(bytes), nil
}
