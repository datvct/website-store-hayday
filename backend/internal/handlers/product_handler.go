package handlers

import (
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"hayday-order-system/backend/internal/httpx"
	"hayday-order-system/backend/internal/models"
	"hayday-order-system/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	service *services.ProductService
}

func NewProductHandler(service *services.ProductService) *ProductHandler {
	return &ProductHandler{service: service}
}

func parsePageSize(c *gin.Context, defaultPageSize, maxPageSize int) (int, int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", strconv.Itoa(defaultPageSize)))
	if limit > maxPageSize {
		limit = maxPageSize
	}
	return page, limit
}

func (h *ProductHandler) PublicList(c *gin.Context) {
	page, limit := parsePageSize(c, 24, 100)
	products, total, err := h.service.List(services.ProductFilter{
		Query:    c.Query("query"),
		Category: c.Query("category"),
		Page:     page,
		Limit:    limit,
		Admin:    false,
	})
	if err != nil {
		httpx.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"items": products,
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

func (h *ProductHandler) PublicGet(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	product, err := h.service.Get(uint(id), false)
	if err != nil {
		httpx.Fail(c, http.StatusNotFound, "Không tìm thấy sản phẩm")
		return
	}
	httpx.OK(c, product)
}

// Image proxies the catalog image so the browser does not depend on a
// third-party CDN's hotlink behavior. Only the known Wikia image hosts are
// allowed to prevent this endpoint from becoming an open URL proxy.
func (h *ProductHandler) Image(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	product, err := h.service.Get(uint(id), false)
	if err != nil || product.ImageURL == "" {
		httpx.Fail(c, http.StatusNotFound, "Không tìm thấy ảnh sản phẩm")
		return
	}

	imageURL, err := url.Parse(product.ImageURL)
	if err != nil || imageURL.Scheme != "https" || (imageURL.Hostname() != "static.wikia.nocookie.net" && imageURL.Hostname() != "vignette.wikia.nocookie.net") {
		httpx.Fail(c, http.StatusBadRequest, "Nguồn ảnh không hợp lệ")
		return
	}

	client := &http.Client{Timeout: 20 * time.Second}
	response, err := client.Get(imageURL.String())
	if err != nil || response.StatusCode >= http.StatusBadRequest {
		if response != nil {
			response.Body.Close()
		}
		httpx.Fail(c, http.StatusBadGateway, "Không tải được ảnh sản phẩm")
		return
	}
	defer response.Body.Close()

	c.Header("Cache-Control", "public, max-age=86400")
	c.Header("Content-Type", response.Header.Get("Content-Type"))
	_, _ = io.Copy(c.Writer, response.Body)
}

func (h *ProductHandler) AdminList(c *gin.Context) {
	page, limit := parsePageSize(c, 24, 100)
	products, total, err := h.service.List(services.ProductFilter{
		Query:    c.Query("query"),
		Category: c.Query("category"),
		Page:     page,
		Limit:    limit,
		Admin:    true,
	})
	if err != nil {
		httpx.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.OK(c, gin.H{
		"items": products,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *ProductHandler) AdminCreate(c *gin.Context) {
	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		httpx.Fail(c, http.StatusBadRequest, "Dữ liệu sản phẩm không hợp lệ")
		return
	}
	product.Name = strings.TrimSpace(product.Name)
	product.SourceTitle = strings.TrimSpace(product.SourceTitle)
	if product.Name == "" {
		product.Name = product.SourceTitle
	}
	if err := h.service.Create(&product); err != nil {
		httpx.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.Created(c, product)
}

func (h *ProductHandler) AdminUpdate(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		httpx.Fail(c, http.StatusBadRequest, "Dữ liệu cập nhật không hợp lệ")
		return
	}
	product, err := h.service.Update(uint(id), body)
	if err != nil {
		httpx.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.OK(c, product)
}

func (h *ProductHandler) AdminDelete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.service.Delete(uint(id)); err != nil {
		httpx.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.OK(c, gin.H{"deleted": true})
}

func (h *ProductHandler) Categories(c *gin.Context) {
	admin := c.Query("admin") == "1"
	cats, err := h.service.DistinctCategories(admin)
	if err != nil {
		httpx.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.OK(c, gin.H{"items": cats})
}
