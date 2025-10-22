import { formatLoadTime } from "./utils.js";

loadPages();

async function crawlUrl() {
  const urlInput = document.getElementById("urlInput");
  const crawlBtn = document.getElementById("crawlBtn");
  const status = document.getElementById("status");
  const url = urlInput.value.trim();

  if (!url) {
    showStatus("Please enter a URL", "error");
    return;
  }

  crawlBtn.disabled = true;
  crawlBtn.textContent = "Crawling...";
  showStatus("Crawling in progress...", "success");

  try {
    const response = await fetch("/api/crawl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (response.ok) {
      showStatus(`✅ Successfully crawled: ${url}`, "success");
      loadPages(); // Refresh the list
    } else {
      showStatus(`❌ Error: ${data.message || data.error}`, "error");
    }
  } catch (error) {
    showStatus(`❌ Network error: ${error.message}`, "error");
  } finally {
    crawlBtn.disabled = false;
    crawlBtn.textContent = "Crawl";
  }
}

function toggleDetails(index) {
  const details = document.getElementById(`details-${index}`);
  const icon = document.getElementById(`icon-${index}`);

  details.classList.toggle("visible");
  icon.classList.toggle("expanded");
}

async function loadPages() {
  const pagesList = document.getElementById("pagesList");
  pagesList.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const response = await fetch("/api/pages");
    const pages = await response.json();

    if (pages.length === 0) {
      pagesList.innerHTML =
        '<p style="color: #666;">No pages crawled yet. Start by crawling a URL above!</p>';
      return;
    }

    pagesList.innerHTML = pages
      .map((page, index) => {
        const statusClass = getStatusClass(page.status_code);
        const contentPreview = truncateText(page.content || "", 200);
        const headers = formatHeaders(page.headers);

        return `
                <div class="page-item">
                    <div class="page-header" data-index="${index}" >
                        <span class="expand-icon" id="icon-${index}"  >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m9 18 6-6-6-6"/>
                            </svg>
                        </span>
                        <div style="flex: 1;">
                            <div class="page-url">${page.url}</div>
                            <div class="page-meta">
                                <span class="status-badge ${statusClass}">${
          page.status_code
        }</span>
                                Crawled: ${new Date(
                                  page.crawled_at
                                ).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <div class="page-details" id="details-${index}">
                        <div class="detail-row">
                            <span class="detail-label">Full URL:</span>
                            <span class="detail-value">${page.url}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Status Code:</span>
                            <span class="detail-value">${
                              page.status_code
                            } ${getStatusText(page.status_code)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Load Time:</span>
                            <span class="detail-value">${formatLoadTime(
                              page.load_time_ms
                            )} ms</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Content Size:</span>
                            <span class="detail-value">${formatBytes(
                              page.content?.length || 0
                            )}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Crawled At:</span>
                            <span class="detail-value">${new Date(
                              page.crawled_at
                            ).toLocaleString()}</span>
                        </div>
                        ${
                          headers
                            ? `
                        <div class="detail-row">
                            <span class="detail-label">Headers:</span>
                            <span class="detail-value">${headers}</span>
                        </div>
                        `
                            : ""
                        }
                        ${
                          contentPreview
                            ? `
                        <div class="detail-row">
                            <span class="detail-label">Content Preview:</span>
                        </div>
                        <div class="content-preview">${escapeHtml(
                          contentPreview
                        )}</div>
                        `
                            : ""
                        }
                    </div>
                </div>
            `;
      })
      .join("");
  } catch (error) {
    pagesList.innerHTML = '<p style="color: red;">Failed to load pages</p>';
  }
}

function getStatusClass(statusCode) {
  if (statusCode >= 200 && statusCode < 300) return "status-2xx";
  if (statusCode >= 300 && statusCode < 400) return "status-3xx";
  if (statusCode >= 400 && statusCode < 500) return "status-4xx";
  if (statusCode >= 500) return "status-5xx";
  return "";
}

function getStatusText(statusCode) {
  const statusTexts = {
    200: "OK",
    201: "Created",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };
  return statusTexts[statusCode] || "";
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function formatHeaders(headers) {
  if (!headers) return "";
  try {
    const parsed = typeof headers === "string" ? JSON.parse(headers) : headers;
    return Object.entries(parsed)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  } catch {
    return "";
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showStatus(message, type) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `status ${type}`;

  if (type === "success") {
    setTimeout(() => {
      status.style.display = "none";
    }, 5000);
  }
}

// Allow Enter key to trigger crawl
document.getElementById("urlInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") crawlUrl();
});

// Use event delegation to handle clicks on dynamically created elements
document.getElementById("pagesList").addEventListener("click", (e) => {
  const header = e.target.closest(".page-header");
  if (header) {
    const index = header.dataset.index;
    console.log("ok clicked this index: ", index);
    toggleDetails(index);
  }
});
