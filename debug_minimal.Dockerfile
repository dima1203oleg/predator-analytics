FROM alpine
WORKDIR /app
COPY libs ./libs
COPY apps/backend ./backend_full
RUN ls -R /app
