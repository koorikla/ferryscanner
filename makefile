IMAGE_NAME := ferry-scanner
PORT := 8080

.PHONY: build run stop logs test

build: build-front
	docker build -t $(IMAGE_NAME) .

build-front:
	cd execution/frontend && npm install && npm run build

test:
	cd execution && go test -v ./...

run: stop build
	docker run -d -p $(PORT):$(PORT) --name $(IMAGE_NAME) $(IMAGE_NAME)
	@echo "Server running on http://localhost:$(PORT)"

stop:
	-docker rm -f $(IMAGE_NAME)

logs:
	docker logs -f $(IMAGE_NAME)
