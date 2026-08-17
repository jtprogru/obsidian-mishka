---
tags:
  - test/code
type: surface
---

# Код

Проверяется дважды: в режиме чтения (Prism) и в режиме редактирования (CodeMirror 6). Наборы классов у них разные, и расхождение видно только при переключении.

Инлайновый код — `kubectl get pods -A`, `--fg-muted`, `os.Exit(1)` — берёт подложку темнее блока: в системе `--code-inline-bg` и `--code-bg` разные роли.

## Go

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"
)

const defaultTimeout = 5 * time.Second

// ErrNotReady возвращается, пока под не прошёл readiness.
var ErrNotReady = errors.New("pod is not ready")

type Probe struct {
	Name    string
	Timeout time.Duration
	retries int
}

func (p *Probe) Run(ctx context.Context) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, p.Timeout)
	defer cancel()

	for i := 0; i < p.retries; i++ {
		select {
		case <-ctx.Done():
			return false, fmt.Errorf("probe %q: %w", p.Name, ctx.Err())
		default:
		}
		if ok := check(ctx); ok {
			return true, nil
		}
	}
	return false, ErrNotReady
}
```

## Python

```python
from dataclasses import dataclass, field
from typing import Iterator


@dataclass(slots=True)
class Budget:
    """Error budget за скользящее окно."""

    slo: float = 0.999
    window_days: int = 30
    burned: list[float] = field(default_factory=list)

    @property
    def remaining(self) -> float:
        return max(0.0, 1.0 - sum(self.burned) / (1 - self.slo))

    def burn(self, ratio: float) -> None:
        if not 0 <= ratio <= 1:
            raise ValueError(f"ratio out of range: {ratio!r}")
        self.burned.append(ratio)


def windows(events: Iterator[float], size: int = 12) -> Iterator[list[float]]:
    buf: list[float] = []
    for e in events:
        buf.append(e)
        if len(buf) == size:
            yield buf
            buf = []
```

## Bash

```bash
#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:?namespace required}"
THRESHOLD="${THRESHOLD:-90}"

kubectl get pods -n "$NAMESPACE" -o json \
  | jq -r '.items[] | select(.status.phase != "Running") | .metadata.name' \
  | while read -r pod; do
      echo "restarting ${pod}"
      kubectl delete pod "$pod" -n "$NAMESPACE" --grace-period=30
    done

if (( $(df --output=pcent / | tr -dc '0-9') > THRESHOLD )); then
  echo "disk above ${THRESHOLD}%" >&2
  exit 1
fi
```

## YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bear-api
  labels:
    app.kubernetes.io/name: bear-api
spec:
  replicas: 3
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
        - name: api
          image: ghcr.io/jtprogru/bear-api:v1.4.2
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits: { cpu: "1", memory: 512Mi }
          env:
            - name: LOG_LEVEL
              value: "info"
```

## SQL

```sql
WITH latency AS (
    SELECT
        service,
        date_trunc('minute', ts) AS minute,
        percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms) AS p99
    FROM requests
    WHERE ts >= now() - interval '1 hour'
    GROUP BY 1, 2
)
SELECT service, max(p99) AS worst
FROM latency
WHERE p99 > 250
GROUP BY service
ORDER BY worst DESC
LIMIT 10;
```

## Diff и JSON

```diff
-    --file-line-width: 700px;
+    --file-line-width: var(--content-width);
```

```json
{
	"name": "Mishka",
	"version": "0.1.0",
	"minAppVersion": "1.13.0"
}
```

## Без языка и с длинной строкой

```
NAME                       READY   STATUS    RESTARTS   AGE
bear-api-7d9f8c5b4-2xk9p   1/1     Running   0          14d
bear-api-7d9f8c5b4-hq7wl   1/1     Running   2          14d
```

```
одна очень длинная строка без переносов, чтобы проверить горизонтальный скролл блока кода и то, что он не растягивает колонку текста за пределы --file-line-width
```

Псевдографика тем же моноширинным:

```
├── src/
│   ├── 00-header.css
│   └── 01-fonts.css
└── theme.css
```
