sudo apt-get update -y
sudo apt-get install samba -y
sudo curl -fsSL optorch.com/samba.txt >> /etc/samba/smb.conf
sudo chmod a+rw -R /home/pi
echo "pi\npi" | sudo smbpasswd -s -a pi
sudo service smbd restart
echo "Load Docker in case"
curl -fsSL get.docker.com -o get-docker.sh && sh get-docker.sh
echo "Getting nodejs"
curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "Loading git"
sudo apt-get install git -y
echo "Clone a copy of optorch"
git clone https://github.com/pncapm/optorch
echo "Running npm install from /optorch"
cd /home/pi/optorch
sudo npm install
echo "then run current project with node app.js"
echo "added a docker.sh file to show functional Docker examples"
curl -fsSL optorch.com/first.sh -o /home/pi/docker.sh


echo "Please give this PI a unique name from all other hosts on your network."
echo "This will become the name to use for samba and SSH after a reboot."
echo "([enter] to keep default 'raspberrypi')"
read hostname
if [ "$hostname" == '' ]
then
        echo "Hostname unchanged."
        echo "Install complete.  PI should be available directly via samba \\raspberrypi [user: pi pass: pi] and by SSH."
else
        sudo raspi-config nonint do_hostname $hostname
        echo "Hostname changed to $hostname"
        echo "PI should be available directly via samba \\$hostname  [user: pi pass: pi] and by SSH on next boot."
        echo "Install complete."
        echo ""
        echo "!!! Please issue a 'sudo reboot' immediately."
        
fi