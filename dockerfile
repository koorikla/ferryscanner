FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ferry.py .

ENTRYPOINT ["python", "ferry.py"]



# docker run --rm car-spot-notifier --date 2025-05-10 --direction HR --start-hour 8 --end-hour 9
# HR = Heltermaa -> Rohuküla
# RH = Rohuküla -> Heltermaa