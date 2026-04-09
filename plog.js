// 获取 posts 目录下的 Markdown，生成列表并以弹窗阅读
document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("plog-list");
  const modalEl = document.getElementById("plog-modal");
  const closeBtn = document.getElementById("plog-close-modal");
  const titleEl = document.getElementById("plog-modal-title");
  const contentEl = document.getElementById("plog-modal-content");

  if (!listEl || !modalEl || !closeBtn || !titleEl || !contentEl) {
    return;
  }

  async function fetchPlogs() {
    try {
      // 直接写出你的文件名，以后写了新的 md，在这里加一行就行
      const files = [
        "git库在工作流上的使用.md",
      ];
  
      listEl.innerHTML = "";
  
      files.forEach((file, idx) => {
        const title = file.replace(/\.md$/i, ''); 
        const li = document.createElement('li');
        li.className = "plog-item";
        li.setAttribute('tabindex', '0');
        li.innerHTML = `<span class="plog-index">${idx + 1}</span><span class="plog-title">${title}</span>`;
        li.onclick = () => showPlogModal(title, file);
        li.onkeypress = function(e){if(e.key==="Enter"){showPlogModal(title,file);}};
        listEl.appendChild(li);
      });
    } catch (e) {
      console.error(e);
      listEl.innerHTML = "<li class=\"plog-error\">无法加载博客列表。</li>";
    }
  }

  async function showPlogModal(title, file) {
    modalEl.style.display = "flex";
    modalEl.setAttribute("aria-hidden", "false");
    titleEl.textContent = title;
    contentEl.innerHTML = "<em>正在加载内容...</em>";
    document.documentElement.classList.add("plog-modal-open");

    try {
      // 中文/空格文件名：必须进行 URL 编码，否则服务器可能找不到资源
      const encoded = encodeURIComponent(file);
      const resp = await fetch(`./posts/${encoded}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const md = await resp.text();
      contentEl.innerHTML = renderMarkdown(md);
    } catch (e) {
      console.error(e);
      contentEl.innerHTML =
        `<span class="plog-error-text">加载内容失败：${String(e?.message || e)}。<br>提示：请用本地服务器方式预览（不要直接双击打开 file://）。</span>`;
    }
  }

  function hideModal() {
    modalEl.style.display = "none";
    modalEl.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("plog-modal-open");
  }

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) hideModal();
  });

  closeBtn.addEventListener("click", hideModal);

  function renderMarkdown(md) {
    const hasMarked = typeof window !== "undefined" && typeof window.marked !== "undefined";
    const hasPurify = typeof window !== "undefined" && typeof window.DOMPurify !== "undefined";

    if (hasMarked) {
      // marked: 常见 Markdown 语法覆盖更完整（表格、代码块、引用、列表等）
      window.marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: true,
        mangle: false,
      });

      const rawHtml = window.marked.parse(md);
      if (hasPurify) {
        return window.DOMPurify.sanitize(rawHtml);
      }
      return rawHtml;
    }

    // CDN 加载失败时的降级：保底可读
    return `<pre style="white-space: pre-wrap; word-break: break-word;">${escapeHtml(md)}</pre>`;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  fetchPlogs();
});

