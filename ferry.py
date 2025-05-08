import requests
import os
import argparse
import time
from datetime import datetime
from dateutil import parser as dt_parser
from dateutil import tz

## notification libs
# from twilio.rest import Client
## OSX terminal alerts
# import pync


TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")  
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_SENDER_NUMBER = os.getenv("TWILIO_SENDER_NUMBER")


def get_available_spots(departure_date: str, direction: str):
    url = f"https://www.praamid.ee/online/events?direction={direction}&departure-date={departure_date}&time-shift=300"
    response = requests.get(url)
    response.raise_for_status()

    data = response.json()
    available = []

    for item in data.get("items", []):
        car_spots = item.get("capacities", {}).get("sv", 0)
        if car_spots > 0:
            available.append({
                "start": item["dtstart"],
                "end": item["dtend"],
                "car_spots": car_spots
            })

    return available


def send_sms_alert(phone_number, message):
    url = 'https://textbelt.com/text'
    data = {
        'phone': phone_number,
        'message': message,
        'key': 'textbelt',  # Use 'textbelt' for free tier
    }
    response = requests.post(url, data=data)
    if response.json()['success']:
        print(f"SMS sent successfully to {phone_number}")
    else:
        print(f"Failed to send SMS to {phone_number}: {response.json()['error']}")

### Twilio option
    # account_sid = TWILIO_ACCOUNT_SID
    # auth_token = TWILIO_AUTH_TOKEN
    # client = Client(account_sid, auth_token)

    # message = client.messages.create(
    #     to={phone_number},      
    #     from_=TWILIO_SENDER_NUMBER,
    #     body={message} 
    # )
    # print(f"Message sent with SID: {message.sid}    {message}")



def main(args):
    while True:
        available = get_available_spots(args.date, args.direction)

        if not available:
            print("No free car spots found. Re-querying in 1 minute...")
            time.sleep(60)  # Wait for 1 minute before re-querying
            continue

        estonia_tz = tz.gettz("Europe/Tallinn")

        for spot in available:
            start_raw = spot["start"]
            start_dt = dt_parser.parse(start_raw).astimezone(estonia_tz)

            if args.start_hour is not None and start_dt.hour < args.start_hour:
                continue
            if args.end_hour is not None and start_dt.hour >= args.end_hour:
                continue

            start = start_dt.strftime("%Y-%m-%d %H:%M")
            car_spots = spot["car_spots"]
            message = f"Woop woop {car_spots} free car spot found for {args.date} on {start} ferry direction {args.direction}."
            print(message)

            send_sms_alert(args.phone, message)

            # OSX alerts
            # pync.notify(message, sound=message)

        break

if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser()
    arg_parser.add_argument("--date", required=True, help="Departure date (YYYY-MM-DD)")
    arg_parser.add_argument("--direction", required=True, choices=["HR", "RH"], help="Heltermaa->Rohuküla: HR or RH")
    arg_parser.add_argument("--start-hour", type=int, help="Only show ferries departing from this hour (0–23)")
    arg_parser.add_argument("--end-hour", type=int, help="Only show ferries departing until this hour (0–23)")
    arg_parser.add_argument("--phone", type=str, help="Phone nr to send sms to eq +37212345678")
    args = arg_parser.parse_args()

    main(args)
