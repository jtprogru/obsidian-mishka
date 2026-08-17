---
tags:
  - test/diagrams
type: surface
---

# Математика и схемы

## Блочные формулы

$$
\text{доступность} = \frac{\text{uptime}}{\text{uptime} + \text{downtime}}
$$

$$
B(t) = 1 - \frac{1}{1 - \text{SLO}} \cdot \frac{1}{T}\int_{0}^{t} e(\tau)\, d\tau
$$

$$
\begin{aligned}
p_{99} &\le 250\ \text{ms} \\
\text{error rate} &\le 0.5\ \% \\
\text{saturation} &\le 85\ \%
\end{aligned}
$$

## Mermaid

Схемы Obsidian рисует своим mermaid, конфиг темы туда не передать. Красится сгенерированный SVG по классам библиотеки — работает, но ломается при её обновлении.

```mermaid
flowchart TD
    A[Алерт] --> B{Пользователи затронуты?}
    B -->|да| C[SEV-2]
    B -->|нет| D[SEV-3]
    C --> E[Митигация: откат, трафик, флаг]
    D --> E
    E --> F{Помогло?}
    F -->|да| G[15 минут стабильности]
    F -->|нет| H[Эскалация]
    G --> I[Resolved]
```

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant G as Gateway
    participant S as Service
    participant D as DB
    U->>G: GET /api/v1/items
    G->>S: proxy
    S->>D: SELECT
    D-->>S: 250 ms
    S-->>G: 200 OK
    G-->>U: 200 OK
```

```mermaid
pie title Источники инцидентов за квартал
    "Деплой" : 42
    "Конфиг" : 27
    "Инфраструктура" : 18
    "Внешняя зависимость" : 13
```

## Изображение

Внешних картинок в тестовом хранилище нет намеренно: тема не должна зависеть от сети. Проверяется рамка и подпись у отсутствующего вложения.

![[несуществующая-картинка.png]]
