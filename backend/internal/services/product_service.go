package services

import (
	"fmt"
	"strings"

	"hayday-order-system/backend/internal/models"

	"gorm.io/gorm"
)

type ProductService struct {
	db *gorm.DB
}

type ProductFilter struct {
	Query      string
	Category   string
	CategoryID uint
	Page       int
	Limit      int
	Admin      bool
}

func NewProductService(db *gorm.DB) *ProductService {
	return &ProductService{db: db}
}

func (s *ProductService) List(filter ProductFilter) ([]models.Product, int64, error) {
	page := filter.Page
	limit := filter.Limit
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 24
	}

	query := s.db.Model(&models.Product{})
	if !filter.Admin {
		query = query.Where("is_active = ?", true)
	}
	if filter.Query != "" {
		q := "%" + strings.ToLower(strings.TrimSpace(filter.Query)) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(source_title) LIKE ?", q, q)
	}
	if filter.CategoryID > 0 {
		query = query.Where("category_id = ?", filter.CategoryID)
	} else if filter.Category != "" && filter.Category != "all" {
		query = query.Where("category_id IN (SELECT id FROM categories WHERE name = ?)", filter.Category)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var products []models.Product
	offset := (page - 1) * limit
	if err := query.Order("sort_order ASC, id ASC").Limit(limit).Offset(offset).Find(&products).Error; err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

func (s *ProductService) ListAllAdmin() ([]models.Product, error) {
	var products []models.Product
	if err := s.db.Order("sort_order ASC, id ASC").Find(&products).Error; err != nil {
		return nil, err
	}
	return products, nil
}

func (s *ProductService) Get(id uint, admin bool) (*models.Product, error) {
	var product models.Product
	query := s.db
	if err := query.First(&product, id).Error; err != nil {
		return nil, err
	}
	if !admin && !product.IsActive {
		return nil, gorm.ErrRecordNotFound
	}
	return &product, nil
}

func (s *ProductService) Create(product *models.Product) error {
	if product.Name == "" {
		product.Name = product.SourceTitle
	}
	categoryID, err := s.ensureCategoryID(product.Category)
	if err != nil {
		return err
	}
	product.CategoryID = categoryID
	return s.db.Create(product).Error
}

func (s *ProductService) Update(id uint, values map[string]interface{}) (*models.Product, error) {
	var product models.Product
	if err := s.db.First(&product, id).Error; err != nil {
		return nil, err
	}
	updates := map[string]interface{}{}
	for key, value := range values {
		if column, ok := productUpdateColumns[key]; ok {
			updates[column] = value
		}
	}
	if categoryName, ok := values["category"].(string); ok {
		categoryID, err := s.ensureCategoryID(categoryName)
		if err != nil {
			return nil, err
		}
		updates["category_id"] = categoryID
	}
	if len(updates) == 0 {
		return &product, nil
	}
	if err := s.db.Model(&product).Updates(updates).Error; err != nil {
		return nil, err
	}
	if err := s.db.First(&product, id).Error; err != nil {
		return nil, err
	}
	return &product, nil
}

// The HTTP API uses JSON camelCase names while PostgreSQL uses snake_case
// columns. Keep the mapping here so every admin update path is consistent.
var productUpdateColumns = map[string]string{
	"sourceTitle":    "source_title",
	"name":           "name",
	"category":       "category",
	"description":    "description",
	"imageUrl":       "image_url",
	"image_url":      "image_url",
	"price":          "price",
	"stockQuantity":  "stock_quantity",
	"stock_quantity": "stock_quantity",
	"unit":           "unit",
	"isActive":       "is_active",
	"is_active":      "is_active",
	"sortOrder":      "sort_order",
	"sort_order":     "sort_order",
}

func (s *ProductService) ensureCategoryID(name string) (uint, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		name = "Chưa phân loại"
	}
	var category models.Category
	err := s.db.Where("LOWER(name) = LOWER(?)", name).First(&category).Error
	if err == gorm.ErrRecordNotFound {
		category = models.Category{Name: name, IsActive: true}
		if err := s.db.Create(&category).Error; err != nil {
			return 0, err
		}
		return category.ID, nil
	}
	if err != nil {
		return 0, err
	}
	return category.ID, nil
}

func (s *ProductService) Delete(id uint) error {
	return s.db.Delete(&models.Product{}, id).Error
}

func (s *ProductService) UpsertSeed(products []models.Product) error {
	for i := range products {
		product := products[i]
		var existing models.Product
		err := s.db.Where("source_title = ?", product.SourceTitle).First(&existing).Error
		if err == nil {
			// Seed data is only a bootstrap for an empty database. Existing
			// products may have been edited in admin (name, category, price,
			// stock, visibility, or image), so never overwrite them on restart.
			// Backfill only the foreign key when an old row does not have one.
			if existing.CategoryID == 0 {
				categoryID, err := s.ensureCategoryID(existing.Category)
				if err != nil {
					return err
				}
				if err := s.db.Model(&existing).Update("category_id", categoryID).Error; err != nil {
					return err
				}
			}
			continue
		}
		categoryID, err := s.ensureCategoryID(product.Category)
		if err != nil {
			return err
		}
		product.CategoryID = categoryID
		if err := s.db.Create(&product).Error; err != nil {
			return err
		}
	}
	return nil
}

func (s *ProductService) DistinctCategories(admin bool) ([]string, error) {
	query := s.db.Model(&models.Product{})
	if !admin {
		query = query.Where("is_active = ?", true)
	}
	var categories []string
	if err := query.Distinct("category").Order("category ASC").Pluck("category", &categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

func (s *ProductService) SeedCount() (int64, error) {
	var count int64
	if err := s.db.Model(&models.Product{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func normalizeLike(value string) string {
	return strings.TrimSpace(strings.ToLower(value))
}

func MakeProductName(sourceTitle string) string {
	return strings.TrimSpace(strings.ReplaceAll(sourceTitle, "File:", ""))
}

func BuildProductDescription(name, category string) string {
	return fmt.Sprintf("Item %s thuộc nhóm %s trong Hay Day.", name, category)
}
