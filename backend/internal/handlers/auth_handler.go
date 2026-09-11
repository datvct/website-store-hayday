package handlers

import (
	"net/http"
	"strings"

	"hayday-order-system/backend/internal/httpx"
	"hayday-order-system/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	service *services.AuthService
}

func NewAuthHandler(service *services.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Fail(c, http.StatusBadRequest, "Dữ liệu đăng nhập không hợp lệ")
		return
	}

	token, admin, err := h.service.Login(strings.TrimSpace(req.Username), req.Password)
	if err != nil {
		httpx.Fail(c, http.StatusUnauthorized, err.Error())
		return
	}

	httpx.OK(c, gin.H{
		"token": token,
		"admin": gin.H{
			"id":       admin.ID,
			"username": admin.Username,
			"role":     admin.Role,
		},
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	adminID, ok := c.Get("adminID")
	if !ok {
		httpx.Fail(c, http.StatusUnauthorized, "Chưa đăng nhập")
		return
	}
	role, _ := c.Get("role")
	httpx.OK(c, gin.H{"adminId": adminID, "role": role})
}
