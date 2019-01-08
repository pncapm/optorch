#!/bin/bash
docker run -d --name watchtower -v /var/run/docker.sock:/var/run/docker.sock v2tec/watchtower
docker stop optorch
docker rm optorch
docker run --name optorch --network host --restart unless-stopped -d pncapm/optorch
