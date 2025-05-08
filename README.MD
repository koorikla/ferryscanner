## Ferryscanner

Scans for free car spots in https://www.praamid.ee/

# HR = Heltermaa -> Rohuküla
# RH = Rohuküla -> Heltermaa


# running in docker/podman

1. Download docker desktop

2. `docker run --rm ghcr.io/koorikla/ferryscanner:main --date 2025-05-10 --direction HR --start-hour 8 --end-hour 9 --phone +37212345678`


# running locally
`python ferry.py --date 2025-05-10 --direction HR --start-hour 8 --end-hour 9 --phone +37212345678`



Readyness for alerts via 
SMS through textbelt or Twilio  
OSX terminal notifications