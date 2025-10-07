docker compose -p valberton-style-storage down;
docker compose -p valberton-style-storage -f docker-compose.yaml pull;
docker compose -p valberton-style-storage -f docker-compose.yaml up --build -d --remove-orphans;
