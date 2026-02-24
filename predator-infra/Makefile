APP_NAME=predator
REGISTRY=localhost:5000
IMAGE=$(REGISTRY)/$(APP_NAME)
TAG=$(shell git rev-parse --short HEAD)

build:
	bash scripts/build.sh

test:
	bash scripts/test.sh

deploy:
	bash scripts/deploy.sh

restart:
	kubectl rollout restart deployment/$(APP_NAME)-dev -n dev-dima

clean:
	docker system prune -af
