# 香港消防／緊急應變新聞簡報

簡潔、手機優先嘅靜態新聞簡報網站。版面（HTML／CSS／JS）同內容（`data/news.json`）分開。

內容以**最近最多 5 日**（`retentionDays`）滾動保存；每日只需覆寫 JSON，唔使改版面。

支援分類標籤、跨日分類篩選，以及每則新聞 1–2 個資料來源連結。

## 檔案結構

```
fsd-news-briefing/
├── index.html          # 頁面骨架
├── css/styles.css      # 樣式（mobile-first）
├── js/app.js           # 以 fetch 載入並渲染 news.json
├── data/news.json      # ★ 每日覆寫嘅內容檔
└── README.md
```

## 本機預覽

**唔好**直接用 `file://` 開 `index.html`——瀏覽器可能封鎖 `fetch`。

```bash
cd /workspace/fsd-news-briefing   # 或本專案根目錄
python3 -m http.server 8080
# 或：npx --yes serve -p 8080
```

打開：<http://localhost:8080/>

## 內容檔路徑

- 絕對路徑：`/workspace/fsd-news-briefing/data/news.json`
- 相對路徑：`data/news.json`

## News Brief 每日更新程序

1. **只改** `data/news.json`；永遠唔好為咗加新聞而改 HTML／CSS／JS。
2. 朝早（約香港時間 07:00）：
   - **前置（prepend）** 今日嘅 `{ "briefingDate": "YYYY-MM-DD", "items": [ ... ] }` 到 `days` 陣列最前（最新喺前）。
   - 若果同一日已經跑過一次，**取代**該 `briefingDate` 嘅條目，唔好重複加一日。
3. 更新頂層 `updatedAt` 為當下 ISO 8601（帶 `+08:00`）。
4. 保留最多 **`retentionDays`（預設 5）** 個日條目；多出嘅最舊日子刪走。
5. 空 `items` 嘅日子可以唔寫入（頁面會跳過空日）。
6. 每則新聞：`category` 必須係允許清單；`sources` 長度 1–2（建議 2 個主流來源）。

## 允許嘅分類（`category`）

一字不差：

| 標籤 | 說明（參考） |
|------|----------------|
| `火警` | 建築／設施火警等（主分類） |
| `特別服務` | 特別服務召喚 |
| `執法行動` | 執法／檢控相關 |
| `政策相關` | 政策、應變部署、科技應用等（主分類） |
| `山火` | 山火／郊野火 |
| `天氣風險` | 火災危險警告、極端天氣等 |
| `救護` | 救護相關 |
| `其他` | 後備 |

未知值會顯示為「其他」。篩選列顯示「全部」＋**檔案中實際出現**嘅分類（跨所有可見日子）。

## JSON Schema（`data/news.json`）

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `updatedAt` | string | ✓ | 最後更新，ISO 8601 + 時區（建議 `+08:00`） |
| `title` | string | ✓ | 頁面／簡報標題 |
| `subtitle` | string | | 副標題 |
| `categories` | string[] | | 建議列出完整 8 個允許分類 |
| `retentionDays` | number | | 保留日數，預設／建議 `5` |
| `days` | array | ✓ | 按日分組；**最新日期在前**；最多 `retentionDays` 個 |
| `days[].briefingDate` | string | ✓ | 該日簡報日期 `YYYY-MM-DD` |
| `days[].items` | array | ✓ | 該日新聞（空陣列等同唔顯示該日） |
| `days[].items[].id` | string | ✓ | 穩定 slug |
| `days[].items[].category` | string | ✓ | 允許清單其中一個 |
| `days[].items[].title` | string | ✓ | 標題 |
| `days[].items[].summary` | string | ✓ | 兩至三句香港繁體摘要 |
| `days[].items[].sources` | array | ✓ | 長度 **1–2**；`{ "name", "url" }`（**唔再用** `sourceName`／`sourceUrl`） |
| `days[].items[].sources[].name` | string | ✓ | 來源顯示名 |
| `days[].items[].sources[].url` | string | ✓ | `https://...` |
| `days[].items[].publishedAt` | string | | 原文日期 `YYYY-MM-DD` |

**已移除（breaking）：** 頂層 `briefingDate`、頂層 `items`。

### 完整示例

```json
{
  "updatedAt": "2026-10-28T07:00:00+08:00",
  "title": "香港消防／緊急應變新聞簡報",
  "subtitle": "供消防處官員參考嘅每日重點新聞",
  "categories": [
    "火警", "特別服務", "執法行動", "政策相關",
    "山火", "天氣風險", "救護", "其他"
  ],
  "retentionDays": 5,
  "days": [
    {
      "briefingDate": "2026-10-28",
      "items": [
        {
          "id": "example-20261028",
          "category": "火警",
          "title": "標題",
          "summary": "第一句。第二句。",
          "sources": [
            { "name": "香港電台", "url": "https://example.com/a" },
            { "name": "政府新聞處", "url": "https://example.com/b" }
          ],
          "publishedAt": "2026-10-28"
        }
      ]
    },
    {
      "briefingDate": "2026-10-27",
      "items": []
    }
  ]
}
```

（示例中空日可省略；頁面會跳過無新聞嘅日子。）

## UI 行為

- 按 `briefingDate` 分組顯示（最新在上）
- 頁頭顯示「最新簡報」日期 + `updatedAt`；頁尾顯示 `updatedAt`
- 分類篩選作用於所有可見日子嘅卡片；某日篩完無結果會隱藏該日區塊
- 資料來源顯示為「資料來源：A · B」

## 部署

純靜態；交 Site Deploy 託管整個目錄即可。無需 build。
