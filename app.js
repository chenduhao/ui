const categories = window.portfolioData?.categories ?? [];
const CATEGORY_KEY = "portfolio_active_category";
const PROJECT_KEY = "portfolio_active_project";
const pathSegments = window.location.pathname.split("/").filter(Boolean);

const readStoredValue = (key) => {
  try {
    return window.sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
};

const storeValue = (key, value) => {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {}
};

const getCategorySlug = (params) => params.get("slug") || pathSegments[1] || readStoredValue(CATEGORY_KEY);
const getProjectSlug = (params) => params.get("project") || pathSegments[2] || readStoredValue(PROJECT_KEY);

const bindCategoryCardEvents = () => {
  document.querySelectorAll("[data-category-slug]").forEach((node) => {
    node.addEventListener("click", () => {
      storeValue(CATEGORY_KEY, node.dataset.categorySlug || "");
    });
  });
};

const bindProjectCardEvents = () => {
  document.querySelectorAll("[data-project-slug]").forEach((node) => {
    node.addEventListener("click", () => {
      storeValue(CATEGORY_KEY, node.dataset.categorySlug || "");
      storeValue(PROJECT_KEY, node.dataset.projectSlug || "");
    });
  });
};

const createTag = (text) => `<span class="meta-tag">${text}</span>`;

const renderCategoryCards = () => {
  const grid = document.querySelector("#category-grid");
  if (!grid) return;

  grid.innerHTML = categories
    .map((category, index) => {
      const noteMarkup = category.notes.map(createTag).join("");
      const preview = category.cover
        ? `<img class="category-cover" src="${category.cover}" alt="${category.title}" loading="lazy" />`
        : `<div class="category-placeholder"><span>${category.title}</span></div>`;

      return `
        <a class="category-card" data-category-slug="${category.slug}" href="/category/${category.slug}/" style="animation-delay: ${index * 0.08}s">
          <div class="category-media">${preview}</div>
          <div class="category-body">
            <div class="category-tags">${noteMarkup}</div>
            <div class="category-footer">
              <h2>${category.title}</h2>
              <span class="category-arrow" aria-hidden="true">→</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");

  bindCategoryCardEvents();
};

const renderItemsGallery = (items) =>
  `
    <section class="detail-gallery">
      ${items
        .map(
          (item, index) => `
            <article class="detail-item" style="animation-delay: ${index * 0.05}s">
              ${buildDetailMedia(item)}
            </article>
          `
        )
        .join("")}
    </section>
  `;

const renderCategoryView = () => {
  const content = document.querySelector("#category-content");
  if (!content) return;

  const params = new URLSearchParams(window.location.search);
  const slug = getCategorySlug(params);
  const category = categories.find((entry) => entry.slug === slug);

  if (!category) {
    document.title = "分类不存在";
    content.innerHTML = `<section class="empty-panel">没有找到相关内容，请返回首页继续浏览。</section>`;
    return;
  }

  document.title = `${category.title} - 作品`;
  storeValue(CATEGORY_KEY, category.slug);
  document.querySelector("#detail-kicker").textContent = category.mode === "projects" ? "项目列表" : "作品展示";
  document.querySelector("#detail-title").textContent = category.title;
  document.querySelector("#detail-desc").textContent = category.description;

  if (category.mode === "gallery") {
    if (!category.items?.length) {
      content.innerHTML = `<section class="empty-panel">这个分类的内容正在整理中，敬请期待。</section>`;
      return;
    }

    content.innerHTML = renderItemsGallery(category.items);
    return;
  }

  if (!category.projects?.length) {
    content.innerHTML = `<section class="empty-panel">这个分类的项目内容正在整理中，敬请期待。</section>`;
    return;
  }

  content.innerHTML = `
    <section class="project-grid">
      ${category.projects
    .map((project, index) => {
      const cover = project.cover
        ? `<img class="project-cover" src="${project.cover}" alt="${project.title}" loading="lazy" />`
        : `<div class="project-placeholder"><span>${project.title}</span></div>`;

      return `
        <a class="project-card" data-category-slug="${category.slug}" data-project-slug="${project.slug}" href="/project/${category.slug}/${project.slug}/" style="animation-delay: ${index * 0.08}s">
          <div class="project-media">${cover}</div>
          <div class="project-body">
            <p class="project-summary">${project.summary ?? ""}</p>
            <div class="project-footer">
              <h2>${project.title}</h2>
              <span class="category-arrow" aria-hidden="true">→</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("")}
    </section>
  `;

  bindProjectCardEvents();
};

const buildDetailMedia = (item) => {
  if (item.kind === "image") {
    return `<img src="${item.path}" alt="${item.title}" loading="lazy" />`;
  }
  if (item.kind === "video") {
    return `<video src="${item.path}" controls preload="metadata"></video>`;
  }
  if (item.kind === "pdf") {
    return `<iframe src="${item.path}" title="${item.title}"></iframe>`;
  }
  return `<a class="file-link" href="${item.path}" target="_blank" rel="noreferrer">打开文件</a>`;
};

const renderProjectDetail = () => {
  const gallery = document.querySelector("#detail-gallery");
  if (!gallery) return;

  const params = new URLSearchParams(window.location.search);
  const categorySlug = params.get("category") || pathSegments[1] || readStoredValue(CATEGORY_KEY);
  const projectSlug = getProjectSlug(params);
  const category = categories.find((entry) => entry.slug === categorySlug);
  const project = category?.projects.find((entry) => entry.slug === projectSlug);

  if (!category || !project) {
    document.title = "项目不存在";
    gallery.innerHTML = `<section class="empty-panel">没有找到相关内容，请返回首页继续浏览。</section>`;
    return;
  }

  document.title = `${project.title} - 作品`;
  storeValue(CATEGORY_KEY, category.slug);
  storeValue(PROJECT_KEY, project.slug);
  document.querySelector("#project-back-link").href = `/category/${category.slug}/`;
  document.querySelector("#project-kicker").textContent = category.title;
  document.querySelector("#project-title").textContent = project.title;
  document.querySelector("#project-desc").textContent = project.summary ?? category.description;

  if (!project.items.length) {
    gallery.innerHTML = `
      <section class="empty-panel">
        这个项目的内容正在整理中，敬请期待。
      </section>
    `;
    return;
  }

  gallery.outerHTML = renderItemsGallery(project.items);
};

renderCategoryCards();
renderCategoryView();
renderProjectDetail();
