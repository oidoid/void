include config.make

.PHONY: default build clean dependencies fat fmt lint test test-fat test-go test-fmt

test: dependencies .WAIT build test-fmt lint test-go .WAIT test-fat
build:; go build -o dist/ ./src/...
clean:; rm --force --recursive dist/
dependencies:
	for exe in go node tinygo wasm-opt watchexec; do
		command -v $$exe > /dev/null || { echo "no $$exe" >&2; false; }
	done
fat:; go run ./src/cmd/fat dist/fat
fmt:; go mod tidy& gofmt -s -w ./src/; wait
lint:; go vet ./src/...&	go tool staticcheck ./src/...; wait
test-fat:; go run ./src/cmd/fat
test-go:
	go test ./src/... |
	grep --color=always --extended --line-buffered '^--- FAIL: [^ ]+|$$' |
	$(if $(value V),cat,sed --unbuffered '/^ok /d; /\[no test files\]$$/d')
test-fmt:
	go mod tidy -diff&
	out=$$(gofmt -l -s ./src/)
	[ -z "$$out" ] || { printf >&2 "unformatted files:\n%s\n" "$$out"; false; }
	wait
