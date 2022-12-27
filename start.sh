#!/bin/bash

docker-compose -f dev.docker-compose.yml up

sleep 5

docker exec mongo1 /scripts/rs-init.sh