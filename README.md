# valberton-style-storage


## Сохранить стейт по `id` пользователя
Очищает все старые танки и записывает новые

`/api/v1/settings?id=<id>` - PUT

```json
{
  "ussr:R33_Churchill_LL": {
    "isWithAlternateItems": false,
    "outfit": 31393
  },
  "germany:G98_Waffentrager_E100": {
    "isWithAlternateItems": false,
    "outfit": 10001
  },
  "france:F18_Bat_Chatillon25t": {
    "isWithAlternateItems": true,
    "outfit": "BB8BBAWDWAEDWAIDWAQDWBADW"
  }
}
```

## Получить стейт по `id` пользователя

`/api/v1/settings?id=<id>` - GET

## Обновить стейт только одного танка пользователя
Переопределяет только указанный танк, остальные остаются без изменений

`/api/v1/settings?id=<id>` - PATCH

```json
{
  "ussr:R33_Churchill_LL": {
    "isWithAlternateItems": false,
    "outfit": 31393
  }
}
```

## Получить стейт по списку танков и `id` пользователя
Во время боя передать массив id игроков и их танков, вернётся объект с ключами в формате `<id>:<vehicle>` если имеется сохранённый стейт

`/api/v1/settings/user-vehicles` - POST

```json
[
  { "id": 123, "vehicle": "ussr:R33_Churchill_LL" },
  { "id": 124, "vehicle": "germany:G98_Waffentrager_E100" }
]
```

### Ответ

```json
{
    "123:ussr:R33_Churchill_LL": {
        "isWithAlternateItems": true,
        "outfit": 1321
    }
}
```