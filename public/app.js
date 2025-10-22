// Load pages on startup
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
      .map(
        (page) => `
                    <div class="page-item">
                        <div class="page-url">${page.url}</div>
                        <div class="page-meta">
                            Status: ${page.status_code} | 
                            Crawled: ${new Date(
                              page.crawled_at
                            ).toLocaleString()}
                        </div>
                    </div>
                `
      )
      .join("");
  } catch (error) {
    pagesList.innerHTML = '<p style="color: red;">Failed to load pages</p>';
  }
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

document.getElementById("urlInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") crawlUrl();
});
