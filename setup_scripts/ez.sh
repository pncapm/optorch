#!/bin/bash
#losetup -P /dev/loop0 raspbian.img
#mount /dev/loop0p2 /mnt
#mount /dev/loop0p1 /mnt/boot
sudo apt-get update -y
sudo apt-get install samba -y
if grep -Fq "[PiShare]" /etc/samba/smb.conf
then
	echo "and PiShare exists" | tee -a /home/pi/setup.log
else
	echo "Writing PiShare info" | tee -a /home/pi/setup.log
	sudo curl -fsSL optorch.com/samba.txt >> /etc/samba/smb.conf
fi
sudo chmod a+rw -R /home/pi
echo "Setting SMB password for pi account to pi" | tee -a /home/pi/setup.log
echo "pi\npi" | sudo smbpasswd -s -a pi
echo "Restarting Samba (smbd) service" | tee -a /home/pi/setup.log
sudo service smbd restart
echo "Download Docker"
curl -fsSL get.docker.com -o get-docker.sh && sh get-docker.sh
echo "Download and run Watchtower Container"
docker run -d --name watchtower --restart always -v /var/run/docker.sock:/var/run/docker.sock v2tec/watchtower:armhf-latest
echo "Download and run Optorch Container"
docker run -d --name optorch --network host --restart always -v /home/pi/logs:/usr/src/app/logs pncapm/optorch
