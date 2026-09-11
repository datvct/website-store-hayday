package handlers

import (
	"net/http"
	"strconv"

	"hayday-order-system/backend/internal/httpx"
	"hayday-order-system/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	service *services.OrderService
}

func NewOrderHandler(service *services.OrderService) *OrderHandler {
	return &OrderHandler{service: service}
}

func (h *OrderHandler) Create(c *gin.Context) {
	var req services.CreateOrderInput
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Fail(c, http.StatusBadRequest, "Dữ liệu đặt hàng không hợp lệ")
		return
	}

	order, items, err := h.service.Create(req)
	if err != nil {
		httpx.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	httpx.Created(c, gin.H{
		"order": order,
		"items": items,
	})
}

func (h *OrderHandler) Track(c *gin.Context) {
	orderCode := c.Query("orderCode")
	phone := c.Query("phone")
	if orderCode == "" || phone == "" {
		httpx.Fail(c, http.StatusBadRequest, "Thiếu mã đơn hoặc số điện thoại")
		return
	}

	order, items, err := h.service.Track(orderCode, phone)
	if err != nil {
		httpx.Fail(c, http.StatusNotFound, "Không tìm thấy đơn hàng")
		return
	}
	httpx.OK(c, gin.H{
		"order": order,
		"items": items,
	})
}

func (h *OrderHandler) AdminList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	orders, total, err := h.service.List(page, limit, status)
	if err != nil {
		httpx.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.OK(c, gin.H{
		"items": orders,
		"total": total,
	})
}

func (h *OrderHandler) AdminGet(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	order, items, err := h.service.Get(uint(id))
	if err != nil {
		httpx.Fail(c, http.StatusNotFound, "Không tìm thấy đơn hàng")
		return
	}
	httpx.OK(c, gin.H{
		"order": order,
		"items": items,
	})
}

func (h *OrderHandler) AdminUpdateStatus(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var req services.UpdateOrderStatusInput
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Fail(c, http.StatusBadRequest, "Dữ liệu trạng thái không hợp lệ")
		return
	}
	order, err := h.service.UpdateStatus(uint(id), req)
	if err != nil {
		httpx.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	httpx.OK(c, order)
}

func (h *OrderHandler) Stats(c *gin.Context) {
	stats, err := h.service.Stats()
	if err != nil {
		httpx.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.OK(c, stats)
}
