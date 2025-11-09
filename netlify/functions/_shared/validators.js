function normalizeString(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function validateStudent(payload = {}) {
  const errors = [];
  const data = {};

  const name = normalizeString(payload.name);
  if (!name) {
    errors.push("姓名不能为空");
  } else if (name.length > 100) {
    errors.push("姓名长度不能超过 100 字");
  } else {
    data.name = name;
  }

  const gender = normalizeString(payload.gender);
  if (gender) {
    if (!["男", "女"].includes(gender)) {
      errors.push("性别只能是 男 或 女");
    } else {
      data.gender = gender;
    }
  } else {
    data.gender = null;
  }

  const age = normalizeNumber(payload.age);
  if (age !== null) {
    if (age < 0 || age > 120) {
      errors.push("年龄应在 0~120 之间");
    } else {
      data.age = Math.round(age);
    }
  } else {
    data.age = null;
  }

  const className = normalizeString(payload.class_name);
  if (className && className.length > 120) {
    errors.push("班级名称长度不能超过 120 字");
  } else {
    data.class_name = className;
  }

  return { data, errors };
}

function validateCourse(payload = {}) {
  const errors = [];
  const data = {};

  const name = normalizeString(payload.name);
  if (!name) {
    errors.push("课程名称不能为空");
  } else if (name.length > 150) {
    errors.push("课程名称过长");
  } else {
    data.name = name;
  }

  const code = normalizeString(payload.code);
  if (!code) {
    errors.push("课程编号不能为空");
  } else if (code.length > 50) {
    errors.push("课程编号过长");
  } else {
    data.code = code;
  }

  const credit = normalizeNumber(payload.credit);
  if (credit !== null) {
    if (credit < 0 || credit > 60) {
      errors.push("学分应在 0~60 之间");
    } else {
      data.credit = Number(credit.toFixed(1));
    }
  } else {
    data.credit = null;
  }

  const teacher = normalizeString(payload.teacher);
  if (teacher && teacher.length > 120) {
    errors.push("任课教师名称过长");
  } else {
    data.teacher = teacher;
  }

  return { data, errors };
}

function validateTeacher(payload = {}) {
  const errors = [];
  const data = {};

  const name = normalizeString(payload.name);
  if (!name) {
    errors.push("教师姓名不能为空");
  } else if (name.length > 120) {
    errors.push("教师姓名过长");
  } else {
    data.name = name;
  }

  const title = normalizeString(payload.title);
  if (title && title.length > 120) {
    errors.push("职称信息过长");
  } else {
    data.title = title;
  }

  const phoneRaw = normalizeString(payload.phone);
  if (phoneRaw) {
    const phone = phoneRaw.replace(/\s+/g, "");
    if (phone.length > 40) {
      errors.push("联系电话过长");
    } else {
      data.phone = phone;
    }
  } else {
    data.phone = null;
  }

  const email = normalizeString(payload.email);
  if (email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      errors.push("请输入合法的邮箱地址");
    } else if (email.length > 160) {
      errors.push("邮箱地址过长");
    } else {
      data.email = email;
    }
  } else {
    data.email = null;
  }

  return { data, errors };
}

module.exports = {
  validateStudent,
  validateCourse,
  validateTeacher,
};

