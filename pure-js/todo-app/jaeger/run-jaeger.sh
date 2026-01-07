 docker run --rm --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4318:4318 \
  -p 4317:4317 \
  -v "$(pwd)/jaeger.yml:/etc/jaeger.yml:ro" \
  cr.jaegertracing.io/jaegertracing/jaeger:2.14.0 \
  --config /etc/jaeger.yml