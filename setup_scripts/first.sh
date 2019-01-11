curl -fsSL get.docker.com -o get-docker.sh && sh get-docker.sh
sudo docker run -d --name watchtower --restart always -v /var/run/docker.sock:/var/run/docker.sock v2tec/watchtower
sudo docker run -d --name optorch --network host --restart always pncapm/optorch