#!/bin/bash
docker run -d --name watchtower --restart always -v /var/run/docker.sock:/var/run/docker.sock v2tec/watchtower:armhf-latest
docker run -d --name optorch --network host --restart always -v /home/pi/logs:/logs pncapm/optorch


