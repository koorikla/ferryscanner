build:
	docker build -t car-spot-notifier .

run:
	docker run --rm car-spot-notifier --date 2025-05-10 --direction HR --start-hour 8 --end-hour 9 --phone +37212345678