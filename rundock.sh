#!/bin/bash
docker stop optorch
docker rm optorch
docker run --name optorch --network host --restart unless-stopped -d pncapm/optorch
