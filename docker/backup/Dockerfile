FROM alpine:3.18

RUN apk add --no-cache postgresql-client curl tar bash

WORKDIR /scripts
COPY backup.sh .
RUN chmod +x backup.sh

WORKDIR /backups

# Default cron schedule: Every day at 03:00 AM
ENV CRON_SCHEDULE="0 3 * * *"

# Create entrypoint to run cron
RUN echo "${CRON_SCHEDULE} /scripts/backup.sh >> /var/log/cron.log 2>&1" > /etc/crontabs/root

CMD ["crond", "-f", "-d", "8"]
