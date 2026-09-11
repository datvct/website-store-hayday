package httpx

import "github.com/gin-gonic/gin"

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
	c.JSON(status, Response{Success: false, Message: message})
}
