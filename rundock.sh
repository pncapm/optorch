#!/bin/bash
docker login
docker build -t pncapm/optorch .
docker push pncapm/optorch


