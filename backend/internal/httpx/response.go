package httpx

import (
	"strings"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

func OK(c *gin.Context, data interface{}) {
	c.JSON(200, Response{Success: true, Data: data})
}

func Created(c *gin.Context, data interface{}) {
	c.JSON(201, Response{Success: true, Data: data})
}

func Fail(c *gin.Context, status int, message string) {
	c.JSON(status, Response{Success: false, Message: LocalizeError(message)})
}

func FailWithData(c *gin.Context, status int, message string, data interface{}) {
	c.JSON(status, Response{Success: false, Message: LocalizeError(message), Data: data})
}

func LocalizeError(message string) string {
	lowerMessage := strings.ToLower(message)
	switch {
	case strings.Contains(lowerMessage, "duplicate key") || strings.Contains(lowerMessage, "unique constraint"):
		if strings.Contains(lowerMessage, "categor") || strings.Contains(lowerMessage, "idx_categories_name") {
			return "Tên danh mục này đã tồn tại"
		}
		return "Dữ liệu này đã tồn tại"
	case strings.Contains(lowerMessage, "record not found") || strings.Contains(lowerMessage, "not found"):
		return "Không tìm thấy dữ liệu yêu cầu"
	case strings.Contains(lowerMessage, "foreign key constraint") || strings.Contains(lowerMessage, "violates foreign key"):
		return "Không thể thực hiện vì dữ liệu đang được liên kết"
	case strings.Contains(lowerMessage, "connection refused") || strings.Contains(lowerMessage, "connection reset") || strings.Contains(lowerMessage, "connection timed out"):
		return "Không thể kết nối đến dịch vụ. Vui lòng thử lại sau"
	case strings.Contains(lowerMessage, "sqlstate") || strings.Contains(lowerMessage, "gorm") || strings.Contains(lowerMessage, "database"):
		return "Hệ thống dữ liệu đang gặp sự cố. Vui lòng thử lại sau"
	case strings.Contains(lowerMessage, "invalid") || strings.Contains(lowerMessage, "malformed") || strings.Contains(lowerMessage, "parse"):
		return "Dữ liệu không hợp lệ"
	case strings.Contains(lowerMessage, "timeout") || strings.Contains(lowerMessage, "deadline exceeded"):
		return "Thao tác mất quá nhiều thời gian. Vui lòng thử lại"
	case strings.Contains(lowerMessage, "permission denied") || strings.Contains(lowerMessage, "unauthorized") || strings.Contains(lowerMessage, "forbidden"):
		return "Bạn không có quyền thực hiện thao tác này"
	case strings.Contains(lowerMessage, "failed") || strings.Contains(lowerMessage, "cannot ") || strings.Contains(lowerMessage, "could not") || strings.Contains(lowerMessage, "unsupported"):
		return "Không thể thực hiện thao tác. Vui lòng thử lại"
	default:
		return message
	}
}
