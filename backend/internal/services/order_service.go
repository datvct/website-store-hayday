package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"hayday-order-system/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderService struct {
	db      *gorm.DB
	payment *PaymentService
}

type CartItemInput struct {
	ProductID uint `json:"productId"`
	Quantity  int  `json:"quantity"`
}

type CreateOrderInput struct {
	CustomerName string          `json:"customerName"`
	Contact      string          `json:"contact"`
	Phone        string          `json:"phone"`
	Note         string          `json:"note"`
	Items        []CartItemInput `json:"items"`
}

type UpdateOrderStatusInput struct {
	Status      models.Status `json:"status"`
	AdminNote   string        `json:"adminNote"`
	TotalAmount *int64        `json:"totalAmount"`
}

func NewOrderService(db *gorm.DB, payment *PaymentService) *OrderService {
	return &OrderService{db: db, payment: payment}
}

func (s *OrderService) nextOrderCode() (string, error) {
	datePrefix := time.Now().Format("20060102")
	var count int64
	if err := s.db.Model(&models.Order{}).Where("order_code LIKE ?", "HD-"+datePrefix+"-%").Count(&count).Error; err != nil {
		return "", err
	}
	return fmt.Sprintf("HD-%s-%03d", datePrefix, count+1), nil
}

func (s *OrderService) Create(input CreateOrderInput) (*models.Order, []models.OrderItem, error) {
	input.CustomerName = strings.TrimSpace(input.CustomerName)
	input.Phone = strings.TrimSpace(input.Phone)
	input.Contact = strings.TrimSpace(input.Contact)
	if input.CustomerName == "" || input.Contact == "" {
		return nil, nil, errors.New("thiếu thông tin khách hàng")
	}
	if len(input.Items) == 0 {
		return nil, nil, errors.New("giỏ hàng trống")
	}

	orderCode, err := s.nextOrderCode()
	if err != nil {
		return nil, nil, err
	}

	order := models.Order{
		OrderCode:      orderCode,
		CustomerName:   input.CustomerName,
		Contact:        input.Contact,
		Phone:          input.Phone,
		Note:           input.Note,
		Status:         models.OrderStatusNew,
		PaymentContent: s.payment.BuildPaymentContent(orderCode),
	}

	var orderItems []models.OrderItem

	err = s.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range input.Items {
			if item.Quantity <= 0 {
				continue
			}

			var product models.Product
			if err := tx.First(&product, item.ProductID).Error; err != nil {
				return err
			}
			if !product.IsActive {
				return errors.New("sản phẩm đã ngừng bán")
			}
			orderItems = append(orderItems, models.OrderItem{
				OrderID:     order.ID,
				ProductID:   product.ID,
				ProductName: product.Name,
				Quantity:    item.Quantity,
				UnitPrice:   product.Price,
				LineTotal:   0,
			})
		}

		// The seller confirms the final amount after reviewing the requested items.
		order.TotalAmount = 0
		if err := tx.Create(&order).Error; err != nil {
			return err
		}
		for i := range orderItems {
			orderItems[i].OrderID = order.ID
		}
		if len(orderItems) > 0 {
			if err := tx.Create(&orderItems).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, nil, err
	}

	return &order, orderItems, nil
}

func (s *OrderService) Track(orderCode, phone, contact string) (*models.Order, []models.OrderItem, error) {
	var order models.Order
	query := s.db.Where("order_code = ?", orderCode)
	if contact != "" {
		query = query.Where("contact = ?", contact)
	} else {
		query = query.Where("phone = ?", phone)
	}
	if err := query.First(&order).Error; err != nil {
		return nil, nil, err
	}
	var items []models.OrderItem
	if err := s.db.Where("order_id = ?", order.ID).Find(&items).Error; err != nil {
		return nil, nil, err
	}
	return &order, items, nil
}

func (s *OrderService) List(page, limit int, status string) ([]models.Order, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	query := s.db.Model(&models.Order{})
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var orders []models.Order
	if err := query.Order("id DESC").Limit(limit).Offset((page - 1) * limit).Find(&orders).Error; err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

func (s *OrderService) Get(id uint) (*models.Order, []models.OrderItem, error) {
	var order models.Order
	if err := s.db.First(&order, id).Error; err != nil {
		return nil, nil, err
	}
	var items []models.OrderItem
	if err := s.db.Where("order_id = ?", order.ID).Find(&items).Error; err != nil {
		return nil, nil, err
	}
	return &order, items, nil
}

func (s *OrderService) UpdateStatus(id uint, input UpdateOrderStatusInput) (*models.Order, error) {
	var order models.Order
	if err := s.db.First(&order, id).Error; err != nil {
		return nil, err
	}

	if err := validateStatusTransition(order.Status, input.Status); err != nil {
		return nil, err
	}

	updates := map[string]interface{}{
		"status":     input.Status,
		"admin_note": input.AdminNote,
	}
	if input.TotalAmount != nil {
		if *input.TotalAmount < 0 {
			return nil, errors.New("tổng tiền không hợp lệ")
		}
		updates["total_amount"] = *input.TotalAmount
	}
	if input.Status == models.OrderStatusPaid {
		now := time.Now()
		updates["payment_confirmed_at"] = &now
	}

	if err := s.db.Model(&order).Updates(updates).Error; err != nil {
		return nil, err
	}
	if err := s.db.First(&order, id).Error; err != nil {
		return nil, err
	}
	return &order, nil
}

func validateStatusTransition(from, to models.Status) error {
	if from == to {
		return nil
	}

	allowed := map[models.Status][]models.Status{
		models.OrderStatusNew:            {models.OrderStatusPendingPayment, models.OrderStatusCancelled},
		models.OrderStatusPendingPayment: {models.OrderStatusPaid, models.OrderStatusCancelled},
		models.OrderStatusPaid:           {models.OrderStatusInProduction, models.OrderStatusCancelled},
		models.OrderStatusInProduction:   {models.OrderStatusCompleted, models.OrderStatusCancelled},
	}

	for _, next := range allowed[from] {
		if next == to {
			return nil
		}
	}

	return errors.New("chuyển trạng thái không hợp lệ")
}

func (s *OrderService) Stats() (map[string]interface{}, error) {
	var totalOrders, totalRevenue int64
	if err := s.db.Model(&models.Order{}).Count(&totalOrders).Error; err != nil {
		return nil, err
	}
	if err := s.db.Model(&models.Order{}).Where("status IN ?", []models.Status{models.OrderStatusPaid, models.OrderStatusInProduction, models.OrderStatusCompleted}).Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue).Error; err != nil {
		return nil, err
	}

	type row struct {
		ProductName string `json:"productName"`
		Qty         int64  `json:"qty"`
	}
	var best []row
	if err := s.db.Table("order_items").Select("product_name, COALESCE(SUM(quantity), 0) as qty").Group("product_name").Order("qty DESC").Limit(10).Scan(&best).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"totalOrders":  totalOrders,
		"totalRevenue": totalRevenue,
		"topProducts":  best,
	}, nil
}

func NewOrderCode() string {
	return uuid.NewString()
}
