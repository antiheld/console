IMG_NAME = brokers-ui
IMG = $(DOCKER_PUSH_REPOSITORY)$(DOCKER_PUSH_DIRECTORY)/$(IMG_NAME)
TAG = $(DOCKER_TAG)

ci-pr: resolve build validate test build-image push-image
ci-master: resolve build validate test build-image push-image
ci-release: resolve build validate test build-image push-image

resolve:
	npm install

build:
	../scripts/prepare-react-components.sh -d react-components
	npm run build

validate:
	npm run lint-check
	eslint -c .eslinterrc ./src

test:
	CI=true npm run test

build-image:
	docker build -t $(IMG_NAME) .

push-image:
	docker tag $(IMG_NAME) $(IMG):$(TAG)
	docker push $(IMG):$(TAG)
