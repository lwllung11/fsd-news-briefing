# 香港消防／緊急應變新聞簡報

簡潔、手機優先嘅靜態新聞簡報網站。版面（HTML／CSS／JS）同內容（`data/news.json`）分開。

內容以**最近最多 5 日**（`retentionDays`）滾動保存；每日只需覆寫 JSON，唔使改版面。

支援分類標籤、跨日分類篩選、每則新聞 1–2 個資料來源，以及**劏房／醫院重點提醒**（`alerts`）。

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
7. 每則新聞必須有 `firstAppearedAt`（ISO 8601，帶 `+08:00`），標示該則**最早出現**時間；頁面顯示為「最早：M月D日 HH:mm」。舊則缺省可接受（唔顯示）。
8. 若涉及劏房或醫院，加上 `"alerts": ["劏房"]` 及／或 `"醫院"`（見下節）。

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

## 重點提醒（`alerts`）— 劏房／醫院

當新聞涉及**劏房**或**醫院**，新聞官必須加上 `alerts`，頁面會以醒目樣式提示官員（琥珀色卡片 +「⚠ 重點提醒」文字橫幅；唔單靠顏色）。

### 允許嘅提醒標籤（一字不差）

| 標籤 | 何時使用 |
|------|----------|
| `劏房` | 事件／政策／執法涉及劏房、分間樓宇單位等 |
| `醫院` | 涉及醫院、醫療處所、醫院管理局設施等 |

可同時標註兩個，例如：`"alerts": ["劏房", "醫院"]`。  
空白、缺省、或非允許值 → **唔顯示**重點樣式。  
（可選）頂層 `alertLabels` 列出允許清單，方便新聞官對照。

### 新聞官指引

1. 只喺內容**確實相關**時加 `alerts`；唔好濫用。
2. 現有示例（I.PARK1、山火）**唔屬**劏房／醫院，故 seed **無** `alerts`。
3. 有 `alerts` 嘅項目會喺**同一日內排前**；篩選列會出現「重點提醒」chip（當日檔案有至少一則時）。
4. **唔建議**用 `priority` 布林；請用 `alerts` 陣列表達重點類型。

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
| `alertLabels` | string[] | | 建議 `["劏房","醫院"]`，供新聞官參考 |
| `days[].items[].publishedAt` | string | | 原文日期 `YYYY-MM-DD` |
| `days[].items[].firstAppearedAt` | string | ✓（新則） | 該則最早出現時間，ISO 8601 + `+08:00`（例 `2026-10-28T11:37:00+08:00`）；頁面顯示「最早：10月28日 11:37」。舊則缺省可接受（唔顯示） |
| `days[].items[].alerts` | string[] | | 可選；僅允許 `劏房`、`醫院`；缺省／空＝無重點提醒 |

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
  "alertLabels": ["劏房", "醫院"],
  "days": [
    {
      "briefingDate": "2026-10-28",
      "items": [
        {
          "id": "example-subdivided-20261028",
          "category": "火警",
          "title": "標題（示例：劏房火警）",
          "summary": "第一句。第二句。",
          "sources": [
            { "name": "香港電台", "url": "https://example.com/a" },
            { "name": "政府新聞處", "url": "https://example.com/b" }
          ],
          "publishedAt": "2026-10-28",
          "firstAppearedAt": "2026-10-28T11:37:00+08:00",
          "alerts": ["劏房"]
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
- 有 `alerts` 嘅卡片顯示「重點提醒」橫幅並置頂該日；可篩「重點提醒」
- 有 `firstAppearedAt` 嘅卡片顯示「最早：M月D日 HH:mm」（香港時間）；缺省／無效則唔顯示
- 資料來源顯示為「資料來源：A · B」

## 部署

純靜態；交 Site Deploy 託管整個目錄即可。無需 build。
