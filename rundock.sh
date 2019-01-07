#!/bin/bash
docker rm optorch
docker run --name optorch --network host -d pncapm/optorch
