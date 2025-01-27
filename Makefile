export COMPOSE_PROJECT_NAME=veriglyph-nexus
export COMPOSE_FILE=docker-compose.yml

.PHONY: up
up:
	$(MAKE) down
	docker-compose build
	docker-compose up -d

.PHONY: down
down:
	docker-compose down --remove-orphans

.PHONY: status
status:
	docker-compose ps

.PHONY: stats
stats:
	docker stats veriglyph-nexus

.PHONY: logs
logs:
	docker-compose logs -f --tail=100

.PHONY: shell
shell:
	docker exec -it veriglyph-nexus sh
