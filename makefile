include config.make

out_demo := dist/demo/index.wasm
tinygo_nodebug := --no-debug
go_tags := $(if $(value DEBUG),--tags=debug,)
tinygo_flags += $(go_tags) --ldflags="-X github.com/oidoid/void/src/demo.version=$(shell git describe --dirty)" --scheduler=none $(if $(value DEBUG),,$(tinygo_nodebug) --panic=trap) $(if $(value V),--print-allocs=.,)
# $(1) flags
pack_demo = go run ./src/cmd/pack --out=dist/demo/ --tsconfig=src/demo/web/tsconfig.json $(1) src/demo/web/assets/index.html
# $(1) flags
packsprites_demo = go run ./src/cmd/packsprites --name=atlas --out=dist/demo/ $(1) src/demo/assets/atlas/

.PHONY: build build-cmd build-demo build-sprites build-web clean dependencies fat-analyze fat-check fat-save fmt fmt-go fmt-mod fmt-web lint lint-critic lint-static lint-vet lint-web test test-fmt-go test-fmt-mod test-go test-web typecheck-web watch watch-go watch-sprites watch-web

watch: export DEBUG := 1
watch: dependencies .WAIT watch-go watch-sprites watch-web
watch-go:; watchexec --exts=go --quiet --watch=src/ -- $(MAKE) build-demo
watch-sprites:; $(call packsprites_demo,--watch)
watch-web:; $(call pack_demo,--watch)

build: build-cmd build-demo build-sprites build-web
build-cmd:; go build $(go_tags) -o dist/ ./src/cmd/...
build-demo: export GOOS := wasip1
build-demo: export GOARCH := wasm
build-demo:
	# no concurrency.
	tinygo build $(tinygo_flags) -o $(out_demo) ./src/demo/web/
	$(if $(value DEBUG),,wasm-opt -o $(out_demo) -Oz --strip-debug --strip-producers $(out_demo))
build-sprites:; $(call packsprites_demo,)
build-web: build-demo build-sprites; $(call pack_demo,--minify --one-file)

clean:; rm --force --recursive dist/

dependencies:
	for exe in go node tinygo wasm-opt watchexec; do
		command -v $$exe > /dev/null || { echo "no $$exe" >&2; false; }
	done

fat-analyze: tinygo_nodebug :=
fat-analyze: tinygo_flags += --size full
fat-analyze: build
fat-check:; go run ./src/cmd/fat check
fat-save:; go run ./src/cmd/fat save

fmt: fmt-mod fmt-go fmt-web
fmt-mod:; go mod tidy
fmt-go:; gofmt -s -w ./src/
fmt-web:; npx lint --fix > /dev/null

lint: lint-critic lint-static lint-vet lint-web
lint-critic:; go tool go-critic check --enableAll --disable=unnamedResult ./src/...
lint-static:; go tool staticcheck ./src/...
lint-vet:; go vet ./src/...
lint-web:; npx lint > /dev/null

test: dependencies .WAIT build test-fmt-go test-fmt-mod lint test-go test-web typecheck-web .WAIT fat-check
test-fmt-go:
	out=$$(gofmt -l -s ./src/)
	[ -z "$$out" ] || { printf >&2 "unformatted files:\n%s\n" "$$out"; false; }
test-fmt-mod:; go mod tidy -diff
test-go:
	go test $(go_tags) ./src/...|
	grep --color=always --extended --line-buffered '^--- FAIL: [^ ]+|$$'|
	sed --regexp-extended --unbuffered $(if $(value V),'','/^ok |\[no test files\]$$/d')
test-web:;
	FORCE_COLOR=3 npm run test:unit|
	sed --unbuffered $(if $(value V),'','1,/✖ failing tests:/ {/[✔ℹ▶✖] /d}')
typecheck-web:; npm run typecheck
