/**
 * 香港消防／緊急應變新聞簡報
 * Loads data/news.json — rolling multi-day briefing with categories + sources.
 */
(function () {
  "use strict";

  var DATA_URL = "data/news.json";

  var ALLOWED_CATEGORIES = [
    "火警",
    "特別服務",
    "執法行動",
    "政策相關",
    "山火",
    "天氣風險",
    "救護",
    "其他",
  ];

  var ALLOWED_ALERTS = ["劏房", "醫院"];
  var FILTER_ALERTS = "重點提醒";

  var elStatus = document.getElementById("status");
  var elList = document.getElementById("news-list");
  var elFilter = document.getElementById("filter-bar");
  var elFilterEmpty = document.getElementById("filter-empty");
  var elTitle = document.getElementById("briefing-title");
  var elSubtitle = document.getElementById("briefing-subtitle");
  var elDate = document.getElementById("briefing-date");
  var elUpdated = document.getElementById("updated-at");
  var elFooterUpdated = document.getElementById("footer-updated");

  var activeFilter = "全部";

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDateYmd(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd || "";
    var parts = ymd.split("-");
    return parts[0] + "年" + Number(parts[1]) + "月" + Number(parts[2]) + "日";
  }

  function formatDateTimeIso(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      var opts = {
        timeZone: "Asia/Hong_Kong",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
      return d.toLocaleString("zh-HK", opts) + "（香港時間）";
    } catch (e) {
      return iso;
    }
  }

  function normalizeCategory(raw) {
    if (raw && ALLOWED_CATEGORIES.indexOf(raw) !== -1) return raw;
    return "其他";
  }

  function categoryClass(cat) {
    var map = {
      火警: "cat-fire",
      山火: "cat-hillfire",
      特別服務: "cat-special",
      執法行動: "cat-enforcement",
      政策相關: "cat-policy",
      天氣風險: "cat-weather",
      救護: "cat-ambulance",
      其他: "cat-other",
    };
    return map[cat] || "cat-other";
  }

  /** Inline SVG icons (currentColor); decorative — pair with visible text labels. */
  var CATEGORY_ICONS = {
    火警:
      '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2c-.4 3.2-3.8 5.4-3.8 9.2 0 2.2 1.4 3.9 3.1 4.7-.5-.9-.8-1.9-.8-3 0-2.8 1.7-4.7 1.7-4.7S16.2 10.5 16.2 13.6c0 1-.2 1.9-.7 2.7 2-.9 3.5-2.8 3.5-5.3C19 6.8 13.5 4 12 2z"/><path fill="currentColor" opacity=".85" d="M12 22a6.2 6.2 0 0 1-6.2-6.2c0-2.6 1.5-4.4 1.5-4.4S9.2 13.2 9.2 15c0 1.6 1.1 2.7 2.4 3.1-.3-.6-.5-1.2-.5-1.9 0-1.7 1-2.9 1-2.9s2.6 1.5 2.6 3.5c0 .6-.1 1.1-.4 1.6 1.5-.5 2.6-1.8 2.6-3.5 0 0 1.5 1.7 1.5 4.1A6.2 6.2 0 0 1 12 22z"/></svg>',
    山火:
      '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 19.5 9.2 10l2.8 3.8 2.4-3.1L21 19.5H3z"/><path fill="currentColor" d="M16.5 3.8c-.3 1.5-1.7 2.5-1.7 4.2 0 1 .5 1.8 1.2 2.2-.2-.4-.4-.9-.4-1.4 0-1.3.8-2.1.8-2.1s1.8 1.2 1.8 2.7c0 .5-.1 1-.4 1.4.9-.5 1.6-1.5 1.6-2.7 0-2-2.2-3.2-2.9-4.3z"/></svg>',
    特別服務:
      '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M14.5 5.5 18 9l-7.2 7.2H7.5v-3.3L14.5 5.5z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12.8 7.2 16.2 10.6"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 19.2c1.8-1.2 3.2-1.2 5 0"/></svg>',
    執法行動:
      '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 3.5 19 6.5v5.2c0 4.6-3.1 7.8-7 9.3-3.9-1.5-7-4.7-7-9.3V6.5L12 3.5z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9.2 12.1 11.1 14l3.7-3.8"/></svg>',
    政策相關:
      '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M7 3.5h7.5L19 8v12.5H7z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M14.5 3.5V8H19"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9.5 12h5M9.5 15.5h5"/></svg>',
    天氣風險:
      '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M8 16.5h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.5-1.2A3.8 3.8 0 0 0 8 16.5z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M10 19v1.5M13 19.5V21M16 19v1.5"/></svg>',
    救護:
      '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M5 4.5h14v15H5z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 8.2v7.6M8.2 12h7.6"/></svg>',
    其他:
      '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 10.8V17"/><circle cx="12" cy="7.6" r="1.1" fill="currentColor"/></svg>',
  };

  function categoryIcon(cat) {
    return CATEGORY_ICONS[cat] || CATEGORY_ICONS["其他"];
  }

  function categoryBadgeHtml(cat) {
    return (
      '<span class="cat-badge ' +
      categoryClass(cat) +
      '">' +
      categoryIcon(cat) +
      '<span class="cat-badge__text">' +
      escapeHtml(cat) +
      "</span></span>"
    );
  }

  function normalizeAlerts(raw) {
    if (!Array.isArray(raw)) return [];
    var out = [];
    var seen = {};
    raw.forEach(function (label) {
      if (ALLOWED_ALERTS.indexOf(label) !== -1 && !seen[label]) {
        seen[label] = true;
        out.push(label);
      }
    });
    return out;
  }

  function alertBannerHtml(alerts) {
    if (!alerts.length) return "";
    var chips = alerts
      .map(function (a) {
        return (
          '<span class="alert-chip alert-chip--' +
          (a === "劏房" ? "subdivided" : a === "醫院" ? "hospital" : "generic") +
          '">' +
          escapeHtml(a) +
          "</span>"
        );
      })
      .join("");
    return (
      '<div class="news-card__alert" role="status">' +
      '<span class="news-card__alert-icon" aria-hidden="true">' +
      '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" focusable="false">' +
      '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 3.8 21 19.5H3L12 3.8z"/>' +
      '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 10v4.2M12 16.8v.2"/>' +
      "</svg></span>" +
      '<span class="news-card__alert-text"><strong>重點提醒</strong>：</span>' +
      '<span class="news-card__alert-chips">' +
      chips +
      "</span></div>"
    );
  }


  function showError(message) {
    elStatus.hidden = false;
    elStatus.className = "status status--error";
    elStatus.setAttribute("role", "alert");
    elStatus.textContent = message;
    elList.hidden = true;
    elList.innerHTML = "";
    elFilter.hidden = true;
    elFilter.innerHTML = "";
    elFilterEmpty.hidden = true;
  }

  function showLoading() {
    elStatus.hidden = false;
    elStatus.className = "status";
    elStatus.removeAttribute("role");
    elStatus.textContent = "載入緊簡報內容…";
    elList.hidden = true;
    elFilter.hidden = true;
    elFilterEmpty.hidden = true;
  }

  function renderSources(sources) {
    var list = Array.isArray(sources) ? sources : [];
    if (list.length === 0) {
      return '<p class="news-card__source">資料來源：—</p>';
    }
    var links = list
      .slice(0, 2)
      .map(function (s) {
        var name = escapeHtml((s && s.name) || "來源");
        var url = (s && s.url) || "#";
        return (
          '<a href="' +
          escapeHtml(url) +
          '" target="_blank" rel="noopener noreferrer">' +
          name +
          "</a>"
        );
      })
      .join('<span class="news-card__source-sep"> · </span>');
    return (
      '<p class="news-card__source"><span class="news-card__source-label">資料來源</span> ' +
      links +
      "</p>"
    );
  }

  function renderItem(item) {
    var li = document.createElement("li");
    var cat = normalizeCategory(item.category);
    var alerts = normalizeAlerts(item.alerts);
    li.className = "news-card" + (alerts.length ? " news-card--alert" : "");
    li.setAttribute("data-category", cat);
    li.setAttribute("data-has-alert", alerts.length ? "true" : "false");
    if (item.id) li.id = "item-" + item.id;

    var metaParts = [];
    metaParts.push(categoryBadgeHtml(cat));
    if (item.publishedAt) {
      metaParts.push(
        '<time class="news-card__date" datetime="' +
          escapeHtml(item.publishedAt) +
          '">' +
          escapeHtml(formatDateYmd(item.publishedAt)) +
          "</time>"
      );
    }

    li.innerHTML =
      alertBannerHtml(alerts) +
      '<div class="news-card__meta">' +
      metaParts.join("") +
      "</div>" +
      "<h2>" +
      escapeHtml(item.title || "（無標題）") +
      "</h2>" +
      '<p class="news-card__summary">' +
      escapeHtml(item.summary || "") +
      "</p>" +
      renderSources(item.sources);

    return li;
  }

  function normalizeDays(data) {
    var days = Array.isArray(data.days) ? data.days.slice() : [];
    days = days
      .map(function (day) {
        var items = day && Array.isArray(day.items) ? day.items.slice() : [];
        items.sort(function (a, b) {
          var aAlert = normalizeAlerts(a && a.alerts).length > 0 ? 0 : 1;
          var bAlert = normalizeAlerts(b && b.alerts).length > 0 ? 0 : 1;
          return aAlert - bAlert;
        });
        return {
          briefingDate: day && day.briefingDate,
          items: items,
        };
      })
      .filter(function (day) {
        return day.briefingDate && day.items.length > 0;
      });

    days.sort(function (a, b) {
      if (a.briefingDate < b.briefingDate) return 1;
      if (a.briefingDate > b.briefingDate) return -1;
      return 0;
    });

    var retain =
      typeof data.retentionDays === "number" && data.retentionDays > 0
        ? data.retentionDays
        : 5;
    if (days.length > retain) days = days.slice(0, retain);
    return days;
  }

  function categoriesPresent(days) {
    var seen = {};
    days.forEach(function (day) {
      day.items.forEach(function (item) {
        seen[normalizeCategory(item.category)] = true;
      });
    });
    return ALLOWED_CATEGORIES.filter(function (c) {
      return seen[c];
    });
  }

  function hasAnyAlerts(days) {
    for (var i = 0; i < days.length; i++) {
      var items = days[i].items || [];
      for (var j = 0; j < items.length; j++) {
        if (normalizeAlerts(items[j].alerts).length) return true;
      }
    }
    return false;
  }

  function renderFilterBar(cats, showAlertFilter) {
    elFilter.innerHTML = "";
    if (!cats.length && !showAlertFilter) {
      elFilter.hidden = true;
      return;
    }

    var labels = ["全部"];
    if (showAlertFilter) labels.push(FILTER_ALERTS);
    labels = labels.concat(cats);
    labels.forEach(function (label) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip";
      btn.setAttribute("data-filter", label);
      if (label === "全部") {
        btn.innerHTML =
          '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>' +
          '<span class="filter-chip__text">全部</span>';
      } else if (label === FILTER_ALERTS) {
        btn.className = "filter-chip filter-chip--alert";
        btn.innerHTML =
          '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 3.8 21 19.5H3L12 3.8z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 10v4.2M12 16.8v.2"/></svg>' +
          '<span class="filter-chip__text">重點提醒</span>';
      } else {
        btn.innerHTML =
          categoryIcon(label) +
          '<span class="filter-chip__text">' +
          escapeHtml(label) +
          "</span>";
      }
      btn.setAttribute("aria-pressed", label === activeFilter ? "true" : "false");
      if (label === activeFilter) btn.classList.add("is-active");
      btn.addEventListener("click", function () {
        activeFilter = label;
        Array.prototype.forEach.call(
          elFilter.querySelectorAll(".filter-chip"),
          function (b) {
            var on = b.getAttribute("data-filter") === activeFilter;
            b.classList.toggle("is-active", on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
          }
        );
        applyFilter();
      });
      elFilter.appendChild(btn);
    });
    elFilter.hidden = false;
  }

  function applyFilter() {
    var anyVisible = false;
    Array.prototype.forEach.call(
      elList.querySelectorAll(".day-section"),
      function (section) {
        var visibleInDay = 0;
        Array.prototype.forEach.call(
          section.querySelectorAll(".news-card"),
          function (li) {
            var cat = li.getAttribute("data-category");
            var hasAlert = li.getAttribute("data-has-alert") === "true";
            var show =
              activeFilter === "全部" ||
              (activeFilter === FILTER_ALERTS && hasAlert) ||
              cat === activeFilter;
            li.hidden = !show;
            if (show) visibleInDay += 1;
          }
        );
        section.hidden = visibleInDay === 0;
        if (visibleInDay > 0) anyVisible = true;
      }
    );
    elFilterEmpty.hidden = anyVisible;
    elList.hidden = !anyVisible;
  }

  function render(data) {
    if (!data || typeof data !== "object") {
      showError("簡報資料格式無效，請稍後再試。");
      return;
    }

    if (data.title) {
      elTitle.textContent = data.title;
      document.title = data.title;
    }

    if (data.subtitle) {
      elSubtitle.textContent = data.subtitle;
      elSubtitle.hidden = false;
    } else {
      elSubtitle.hidden = true;
    }

    var days = normalizeDays(data);
    activeFilter = "全部";
    elList.innerHTML = "";

    if (days.length === 0) {
      showError("近五日暫無新聞項目。");
      return;
    }

    var latest = days[0].briefingDate;
    elDate.textContent = "最新簡報：" + formatDateYmd(latest);
    elDate.setAttribute("datetime", latest);

    var updatedText = formatDateTimeIso(data.updatedAt);
    if (updatedText) {
      elUpdated.textContent = "最後更新：" + updatedText;
      elFooterUpdated.textContent = "頁面內容最後更新：" + updatedText;
    }

    days.forEach(function (day) {
      var section = document.createElement("li");
      section.className = "day-section";
      section.setAttribute("data-briefing-date", day.briefingDate);

      var heading = document.createElement("h2");
      heading.className = "day-section__heading";
      var time = document.createElement("time");
      time.dateTime = day.briefingDate;
      time.textContent = formatDateYmd(day.briefingDate);
      var label = document.createElement("span");
      label.className = "day-section__label";
      label.textContent = "簡報";
      heading.appendChild(label);
      heading.appendChild(time);
      section.appendChild(heading);

      var ol = document.createElement("ol");
      ol.className = "day-section__list";
      day.items.forEach(function (item) {
        ol.appendChild(renderItem(item));
      });
      section.appendChild(ol);
      elList.appendChild(section);
    });

    renderFilterBar(categoriesPresent(days), hasAnyAlerts(days));

    elStatus.hidden = true;
    elList.hidden = false;
    elFilterEmpty.hidden = true;
  }

  function load() {
    showLoading();
    fetch(DATA_URL, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }
        return res.json();
      })
      .then(render)
      .catch(function (err) {
        console.error(err);
        showError(
          "無法載入簡報內容（data/news.json）。請用本機伺服器開啟（例如 npx serve 或 python3 -m http.server），唔好直接用 file:// 開啟。"
        );
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
