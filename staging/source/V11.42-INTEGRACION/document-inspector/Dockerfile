# Candidate only: review package vulnerabilities, licenses and pin image digest before deployment.
FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pil poppler-utils && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY inspect_document.py test_inspector.py /app/
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
USER 65532:65532
ENTRYPOINT ["/usr/bin/python3","/app/inspect_document.py"]
