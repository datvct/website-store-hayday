FROM golang:1.24-alpine AS build

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

FROM alpine:3.20
RUN adduser -D -H appuser
WORKDIR /app
COPY --from=build /out/server /app/server
COPY --from=build /src/seeds/products.json /app/seeds/products.json
USER appuser
EXPOSE 8080
CMD ["/app/server"]
