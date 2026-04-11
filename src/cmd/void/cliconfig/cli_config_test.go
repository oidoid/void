package cliconfig

import "testing"

func TestStripJSONC(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want string
	}{
		{
			name: "no comments, no trailing commas",
			in:   `{"a":1}`,
			want: `{"a":1}`,
		},
		{
			name: "line comment stripped",
			in:   "{\n\"a\":1 // comment\n}",
			want: "{\n\"a\":1 \n}",
		},
		{
			name: "url in string preserved",
			in:   `{"url":"http://example.com"}`,
			want: `{"url":"http://example.com"}`,
		},
		{
			name: "trailing comma before brace",
			in:   `{"a":1,}`,
			want: `{"a":1}`,
		},
		{
			name: "trailing comma before bracket",
			in:   `{"a":[1,]}`,
			want: `{"a":[1]}`,
		},
		{
			name: "trailing comma with whitespace",
			in:   "{\n\"a\":1,\n}",
			want: "{\n\"a\":1\n}",
		},
		{
			name: "comment after trailing comma",
			in:   "{\n\"a\":1, // comment\n}",
			want: "{\n\"a\":1 \n}",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := string(stripJSONC([]byte(test.in)))
			if got != test.want {
				t.Errorf("got %q, want %q", got, test.want)
			}
		})
	}
}
