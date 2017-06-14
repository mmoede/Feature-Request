#!/usr/bin/env bash

sudo apt-get update
sudo apt-get install -y python-dev python-pip


sudo pip install virtualenv

cd /vagrant/
virtualenv feature-request --always-copy

feature-request/bin/pip install sqlalchemy
feature-request/bin/pip install Flask
feature-request/bin/pip install flask-sqlalchemy==2.1
feature-request/bin/pip install sqlalchemy-migrate
feature-request/bin/pip install flask-restful
feature-request/bin/pip install flask-httpauth
feature-request/bin/pip install flask-wtf
feature-request/bin/pip install coverage

sudo apt-get -y install git




