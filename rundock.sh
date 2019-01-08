#!/bin/bash
docker run -d --name watchtower --restart always -v /var/run/docker.sock:/var/run/docker.sock v2tec/watchtower
docker run -d --name optorch --network host --restart always pncapm/optorch

