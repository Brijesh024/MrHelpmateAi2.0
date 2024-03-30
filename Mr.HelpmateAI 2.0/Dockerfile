FROM python:3.10

WORKDIR MrHelpmateAI2-app

# copy of requirements file
COPY requirements.txt ./requirements.txt

# install pacakges
RUN pip3 install -r requirements.txt

# copying all files over
COPY . .
# command to launch app
CMD run app.py