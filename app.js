const API_BASE = "/.netlify/functions";

const state = {
  token: null,
  activeResource: "students",
  resources: {
    students: {
      label: "学生管理",
      searchPlaceholder: "按姓名或班级搜索学生",
      fields: [
        { key: "name", label: "姓名", type: "text", required: true, placeholder: "例如：张三" },
        { key: "gender", label: "性别", type: "select", options: ["男", "女"], required: true },
        { key: "age", label: "年龄", type: "number", min: 1, max: 120, placeholder: "18" },
        { key: "class_name", label: "班级", type: "text", placeholder: "高二(1)班" },
      ],
    },
    courses: {
      label: "课程管理",
      searchPlaceholder: "按课程/编号/教师搜索课程",
      fields: [
        { key: "name", label: "课程名称", type: "text", required: true, placeholder: "高等数学" },
        { key: "code", label: "课程编号", type: "text", required: true, placeholder: "MATH101" },
        { key: "credit", label: "学分", type: "number", min: 0, max: 60, step: "0.5", placeholder: "3" },
        { key: "teacher", label: "任课教师", type: "text", placeholder: "王老师" },
      ],
    },
    teachers: {
      label: "教师管理",
      searchPlaceholder: "按姓名/职称/联系方式搜索教师",
      fields: [
        { key: "name", label: "姓名", type: "text", required: true, placeholder: "李老师" },
        { key: "title", label: "职称", type: "text", placeholder: "高级教师" },
        { key: "phone", label: "联系电话", type: "tel", placeholder: "13800001234" },
        { key: "email", label: "电子邮箱", type: "email", placeholder: "teacher@example.com" },
      ],
    },
  },
};

/**
 * Simple wrapper for fetch with JSON defaults.
 */
async function apiRequest(path, { method = "GET", body, params } = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, value);
      }
    });
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        console.error("无法解析服务器响应", error);
      }
    }
  }

  if (!response.ok) {
    const message = payload?.error || payload?.message || "请求失败";
    const error = new Error(message);
    error.status = response.status;
    error.details = payload?.details;
    throw error;
  }

  return payload;
}

function showAlert(message, type = "info", delay = 3500) {
  const alerts = document.querySelector("#alerts");
  const el = document.createElement("div");
  el.className = `alert-message alert-${type}`;
  el.textContent = message;
  alerts.appendChild(el);
  if (delay > 0) {
    setTimeout(() => el.remove(), delay);
  }
}

function switchTab(event) {
  const target = event.target;
  if (!target.matches(".tab-btn")) return;

  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  target.classList.add("active");

  document.querySelectorAll(".form").forEach((form) => form.classList.remove("active"));
  document.querySelector(`#${target.dataset.tab}`).classList.add("active");
}

function initAuthForms() {
  document.querySelector(".tabs").addEventListener("click", switchTab);

  document.querySelector("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const username = form.username.value.trim();
    const password = form.password.value;
    if (!username || !password) {
      showAlert("请填写用户名和密码", "error");
      return;
    }

    try {
      const result = await apiRequest("/auth-login", {
        method: "POST",
        body: { username, password },
      });
      handleAuthSuccess(result);
    } catch (error) {
      showAlert(error.message, "error");
    }
  });

  document.querySelector("#register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const username = form.username.value.trim();
    const password = form.password.value;
    const passwordConfirm = form.passwordConfirm.value;

    if (password !== passwordConfirm) {
      showAlert("两次输入的密码不一致", "error");
      return;
    }

    try {
      const result = await apiRequest("/auth-register", {
        method: "POST",
        body: { username, password },
      });
      showAlert("注册成功，已自动登录", "success");
      handleAuthSuccess(result);
    } catch (error) {
      showAlert(error.message, "error");
    }
  });
}

function handleAuthSuccess(result) {
  state.token = result.token;
  localStorage.setItem("sms_token", state.token);
  document.querySelector("#auth-panel").classList.add("hidden");
  document.querySelector("#top-nav").classList.remove("hidden");
  document.querySelector("#management-panel").classList.remove("hidden");
  activateResource(state.activeResource);
}

function restoreSession() {
  const storedToken = localStorage.getItem("sms_token");
  if (storedToken) {
    state.token = storedToken;
    document.querySelector("#auth-panel").classList.add("hidden");
    document.querySelector("#top-nav").classList.remove("hidden");
    document.querySelector("#management-panel").classList.remove("hidden");
    activateResource(state.activeResource);
  }
}

function initNavigation() {
  document.querySelector("#top-nav").addEventListener("click", (event) => {
    if (event.target.matches(".nav-btn[data-target]")) {
      const target = event.target.dataset.target;
      const resource = target.replace("-panel", "");
      activateResource(resource);
    } else if (event.target.matches("#logout-btn")) {
      logout();
    }
  });
}

function logout() {
  state.token = null;
  localStorage.removeItem("sms_token");
  document.querySelector("#auth-panel").classList.remove("hidden");
  document.querySelector("#top-nav").classList.add("hidden");
  document.querySelector("#management-panel").classList.add("hidden");
  showAlert("已退出登录", "info");
}

function activateResource(resourceKey) {
  state.activeResource = resourceKey;
  const resource = state.resources[resourceKey];
  document.querySelector("#panel-title").textContent = resource.label;
  const searchInput = document.querySelector("#search-input");
  if (searchInput) {
    searchInput.placeholder = resource.searchPlaceholder || "搜索关键字";
    searchInput.value = "";
  }
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    if (btn.dataset.target === `${resourceKey}-panel`) {
      btn.classList.add("active");
    } else if (btn.matches(".nav-btn[data-target]")) {
      btn.classList.remove("active");
    }
  });

  renderTableHeader(resource.fields);
  fetchResourceList();
}

function renderTableHeader(fields) {
  const header = document.querySelector("#table-header");
  header.innerHTML = "";
  fields.forEach((field) => {
    const th = document.createElement("th");
    th.textContent = field.label;
    header.appendChild(th);
  });
  const actions = document.createElement("th");
  actions.textContent = "操作";
  header.appendChild(actions);
}

async function fetchResourceList(query = "") {
  try {
    const data = await apiRequest(`/${state.activeResource}`, {
      params: query ? { q: query } : undefined,
    });
    renderTableBody(data.items ?? []);
  } catch (error) {
    if (error.status === 401) {
      logout();
    } else {
      showAlert(error.message, "error");
    }
  }
}

function renderTableBody(items) {
  const body = document.querySelector("#table-body");
  const emptyState = document.querySelector("#empty-state");
  body.innerHTML = "";

  if (!items.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  const fields = state.resources[state.activeResource].fields;
  items.forEach((item) => {
    const row = document.createElement("tr");
    row.dataset.id = item.id;
    fields.forEach((field) => {
      const cell = document.createElement("td");
      cell.dataset.field = field.key;
      let value = item[field.key];
      if (field.type === "number" && value !== null && value !== undefined) {
        value = Number(value);
      }
      cell.textContent = value ?? "";
      row.appendChild(cell);
    });
    const actionsCell = document.createElement("td");
    actionsCell.className = "actions";
    actionsCell.innerHTML = `
      <button class="link-btn edit-btn">编辑</button>
      <button class="link-btn danger delete-btn">删除</button>
    `;
    row.appendChild(actionsCell);
    body.appendChild(row);
  });
}

function initSearchAndActions() {
  document.querySelector("#search-btn").addEventListener("click", () => {
    const query = document.querySelector("#search-input").value.trim();
    fetchResourceList(query);
  });

  document.querySelector("#search-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const query = event.currentTarget.value.trim();
      fetchResourceList(query);
    }
  });

  document.querySelector("#add-record-btn").addEventListener("click", () => {
    openRecordDialog("create");
  });

  document.querySelector("#table-body").addEventListener("click", (event) => {
    const row = event.target.closest("tr");
    if (!row) return;
    const id = row.dataset.id;

    if (event.target.matches(".edit-btn")) {
      openRecordDialog("update", id);
    } else if (event.target.matches(".delete-btn")) {
      deleteRecord(id);
    }
  });
}

function buildFieldInput(field, value = "") {
  const label = document.createElement("label");
  label.textContent = field.label;

  let input;
  if (field.type === "select") {
    input = document.createElement("select");
    field.options.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      input.appendChild(opt);
    });
    if (value) {
      input.value = value;
    }
  } else {
    input = document.createElement("input");
    input.type = field.type || "text";
    if (value !== undefined && value !== null) {
      input.value = value;
    }
    if (field.placeholder) {
      input.placeholder = field.placeholder;
    }
  }

  input.name = field.key;
  if (field.required) {
    input.required = true;
  }
  if (field.min !== undefined) input.min = field.min;
  if (field.max !== undefined) input.max = field.max;
  if (field.step !== undefined) input.step = field.step;

  label.appendChild(input);
  return label;
}

async function openRecordDialog(mode, id = null) {
  const dialog = document.querySelector("#record-dialog");
  const fieldsContainer = document.querySelector("#dialog-fields");
  const fields = state.resources[state.activeResource].fields;
  const form = document.querySelector("#record-form");

  document.querySelector("#dialog-title").textContent = mode === "create" ? "新增记录" : "编辑记录";
  fieldsContainer.innerHTML = "";
  form.reset();

  let existingData = {};
  if (mode === "update") {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    fields.forEach((field) => {
      const cell = row.querySelector(`[data-field="${field.key}"]`);
      existingData[field.key] = cell?.textContent ?? "";
    });
  }

  fields.forEach((field) => {
    fieldsContainer.appendChild(buildFieldInput(field, existingData[field.key]));
  });

  dialog.returnValue = "";
  dialog.showModal();

  dialog.onclose = async () => {
    if (dialog.returnValue === "cancel") return;
    const formData = new FormData(document.querySelector("#record-form"));
    const payload = Object.fromEntries(formData.entries());

    // Coerce numeric fields
    fields.forEach((field) => {
      if (field.type === "number" && payload[field.key] !== "") {
        payload[field.key] = Number(payload[field.key]);
      }
    });

    try {
      if (mode === "create") {
        await apiRequest(`/${state.activeResource}`, { method: "POST", body: payload });
        showAlert("创建成功", "success");
      } else {
        await apiRequest(`/${state.activeResource}/${id}`, { method: "PUT", body: payload });
        showAlert("更新成功", "success");
      }
      fetchResourceList();
    } catch (error) {
      if (error.status === 401) {
        logout();
      } else {
        showAlert(error.message, "error");
      }
    }
  };
}

async function deleteRecord(id) {
  if (!confirm("确定要删除该记录吗？")) return;

  try {
    await apiRequest(`/${state.activeResource}/${id}`, { method: "DELETE" });
    showAlert("删除成功", "success");
    fetchResourceList();
  } catch (error) {
    if (error.status === 401) {
      logout();
    } else {
      showAlert(error.message, "error");
    }
  }
}

function initDialogFormBehavior() {
  const dialog = document.querySelector("#record-dialog");
  const form = document.querySelector("#record-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    dialog.returnValue = "submit";
    dialog.close("submit");
  });
}

function init() {
  initAuthForms();
  initNavigation();
  initSearchAndActions();
  initDialogFormBehavior();
  restoreSession();
}

document.addEventListener("DOMContentLoaded", init);

