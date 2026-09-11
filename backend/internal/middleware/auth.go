package middleware

import (
	"net/http"
	"strings"

	"hayday-order-system/backend/internal/httpx"
	"hayday-order-system/backend/internal/services"

	"github.com/gin-gonic/gin"
)

func RequireAdminAuth(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			httpx.Fail(c, http.StatusUnauthorized, "Thiếu token xác thực")
			c.Abort()
			return
		}

		tokenString := strings.TrimSpace(strings.TrimPrefix(header, "Bearer"))
		claims, err := authService.ParseToken(tokenString)
		if err != nil {
			httpx.Fail(c, http.StatusUnauthorized, "Token không hợp lệ")
			c.Abort()
			return
		}
		if claims.Role != "admin" {
			httpx.Fail(c, http.StatusForbidden, "Không đủ quyền truy cập")
			c.Abort()
			return
		}

		c.Set("adminID", claims.AdminID)
		c.Set("role", claims.Role)
		c.Next()
	}
}
