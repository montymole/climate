# WIP!
This is a personal project to monitor and control my greenhouse.
Use with own risk.

My current setup is following: 
In greenhouse Arduino Nano with sensors, connected to Atom PC running LINUX,
also raspberry is possible!

## configure

OPEN_WEATHER_APPID    your open weather appid
OPEN_WEATHER_LOCATION   location of weather station (see open weather)
ARDUINO_HOST         ip of PC connected to Arduino
ARDUINO_HOST_PORT    http port of USBtoHTTP
PORT     http server port

## TODO
schematics and partlists for Arduino #1 and #2

## Features
Log open weather weather, nearest weather station location.

Devices:

Arduino #1 connected to PC (or rasp):
   - measures temperature, humidity (DHT22)
   - measures soilmoisture (grove soil moisture sensor)
   - measure sunlight (solarpanel)
   - serial communcation to PC
   - display to OLED
 
PC #1 (or Raspberry) with WIFI
USBtoHTTP forward measurements (and log to file).

PC#2 (ocan be same as PC #1, but I use another server)
index.js
Plot data to console (rasp) and jsob / html over http.

## Planned
Display Open weather forecasts
Save logs to database & view logs by date. Currently log is
not saved.

arduino #2 power controller
  - ATX power on (5V & 12V systems)
  - 5V Raspberry power
  - relay 12V to LED lights
  - relay 12V to cooling fan
  - relay 220V (for heating and water pump)


