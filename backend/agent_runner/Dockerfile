FROM python:3.13-slim

RUN pip install --no-cache-dir httpx

COPY runner.py /runner.py

ENTRYPOINT ["python", "/runner.py"]
