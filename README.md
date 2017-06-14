# Feature-Request
Feature-Request is a web app for tracking client-requested features for insurance software. It allows the user to keep track of specific information related to the feature request such as which client requested the feature, a description, target date, and product area. It will also allow for feature priority tracking on a per-client basis.

#Setup
The current version on the master branch was developed using Vagrant to manage the virtual machine. If you would also like to use Vagrant you will need to install VirtualBox and Vagrant on your machine. The Vagrant provisioning is set up in this repository so you should be able to clone this repository, navigate to the directory containing the Vagrantfile in your terminal, and issue the "vagrant up" command.

The bootstrap.sh shell script in .provision assumes there will be a vagrant directory. If you are not using Vagrant you may be able to run this script if you take out any reference to the vagrant directory but I have not tested this. Otherwise, you'll have to manually go through everything listed in bootstrap.sh until I have better provisioning set up.

After everything is installed and ready to go you will need to run db_create.py to create the database and then run db_migrate.py.

When the database is created you can then start the RESTful web server by running rest-server.py. The server will be listening to localhost:5000 so make sure you have any necessary port forwarding set. Navigate to http://localhost:5000/index.html in your browser and enjoy using the application!