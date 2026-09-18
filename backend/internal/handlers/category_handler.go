package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"hayday-order-system/backend/internal/httpx"
	"hayday-order-system/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	service *services.CategoryService
}

func NewCategoryHandler(service *services.CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

func (h *CategoryHandler) List(c *gin.Context) {
	categories, err := h.service.List(false)
	if err != nil {
		httpx.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	names := make([]string, 0, len(categories))
	for _, category := range categories {
		names = append(names, category.Name)
	}
	httpx.OK(c, gin.H{"items": names})
}

func (h *CategoryHandler) AdminList(c *gin.Context) {
	categories, err := h.service.List(true)
	if err != nil {
		httpx.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.OK(c, gin.H{"items": categories})
}

func (h *CategoryHandler) Create(c *gin.Context) {
	var body struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Name) == "" {
		httpx.Fail(c, http.StatusBadRequest, "Tên danh mục không hợp lệ")
		return
	}
	category, err := h.service.Create(body.Name)
	if err != nil {
		httpx.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	httpx.Created(c, category)
}

func (h *CategoryHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct {
		Name     string `json:"name"`
		IsActive *bool  `json:"isActive"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Name) == "" {
		httpx.Fail(c, http.StatusBadRequest, "Dữ liệu danh mục không hợp lệ")
		return
	}
	isActive := true
	if body.IsActive != nil {
		isActive = *body.IsActive
	}
	category, err := h.service.Update(uint(id), body.Name, isActive)
	if err != nil {
		httpx.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	httpx.OK(c, category)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.service.Delete(uint(id)); err != nil {
		httpx.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	httpx.OK(c, gin.H{"deleted": true})
}
