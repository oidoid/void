include config.make

.PHONY: build build-cmd build-demo build-web clean dependencies fat fat-analyze fat-check fmt fmt-go fmt-mod fmt-web lint lint-critic lint-static lint-vet lint-web test test-fmt-go test-fmt-mod test-go test-web typecheck-web watch watch-go watch-web

out_demo := dist/demo.wasm
tinygo_flags +=

watch: export DEBUG := 1
watch: dependencies .WAIT watch-go watch-web
watch-go:; watchexec --exts=go --quiet --watch=src/ -- $(MAKE) build-demo
watch-web:; npm run watch

build: build-cmd build-demo build-web
build-cmd:; go build -o dist/ ./src/cmd/...
build-demo:
	# no concurrency.
	tinygo build $(tinygo_flags) -o $(out_demo) --scheduler=none --target=wasm ./src/demo/web/
	$(if $(value DEBUG),,wasm-opt -o $(out_demo) -Oz --strip-debug --strip-producers $(out_demo))
build-web: build-demo; npm run build

clean:; rm --force --recursive dist/

dependencies:
	for exe in go node tinygo wasm-opt watchexec; do
		command -v $$exe > /dev/null || { echo "no $$exe" >&2; false; }
	done

fat:; go run ./src/cmd/fat dist/demo/demo.wasm dist/demo/index.css dist/demo/index.html dist/demo/index.js
fat-analyze: tinygo_flags += -size full
fat-analyze: build
fat-check:; go run ./src/cmd/fat

fmt: fmt-mod fmt-go fmt-web
fmt-mod:; go mod tidy
fmt-go:; gofmt -s -w ./src/
fmt-web:; npx lint --fix

lint: lint-critic lint-static lint-vet lint-web
lint-critic:; go tool go-critic check --enableAll ./src/...
lint-static:; go tool staticcheck ./src/...
lint-vet:; go vet ./src/...
lint-web:; npx lint

test: dependencies .WAIT build test-fmt-go test-fmt-mod lint test-go test-web typecheck-web .WAIT fat-check
test-fmt-go:
	out=$$(gofmt -l -s ./src/)
	[ -z "$$out" ] || { printf >&2 "unformatted files:\n%s\n" "$$out"; false; }
test-fmt-mod:; go mod tidy -diff
test-go:
	go test ./src/...|
	grep --color=always --extended --line-buffered '^--- FAIL: [^ ]+|$$'|
	sed --regexp-extended --unbuffered $(if $(value V),'','/^ok |\[no test files\]$$/d')
test-web:;
	FORCE_COLOR=3 npm run test:unit|
	sed --unbuffered $(if $(value V),'','1,/✖ failing tests:/ {/[✔ℹ▶✖] /d}')
typecheck-web:; npm run typecheck
