import { request } from "./client";

export const authApi = {
  login(payload) {
    return request("/admin/auth/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify(payload),
    });
  },
};
