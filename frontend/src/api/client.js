const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export async function request(path, options = {}) {
  const { skipAuth = false, ...requestOptions } = options;
  const headers = {
    "Content-Type": "application/json",
    ...(requestOptions.headers || {}),
  };
  const token = localStorage.getItem("hd_token");
  if (token && !skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Yêu cầu không thành công (mã lỗi ${response.status})`);
  }
  return payload.data ?? payload;
}
