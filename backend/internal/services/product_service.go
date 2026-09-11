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
	Query    string
	Category string
	Page     int
	Limit    int
	Admin    bool
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
	if filter.Category != "" && filter.Category != "all" {
		query = query.Where("category = ?", filter.Category)
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
	return s.db.Create(product).Error
}

func (s *ProductService) Update(id uint, values map[string]interface{}) (*models.Product, error) {
	var product models.Product
	if err := s.db.First(&product, id).Error; err != nil {
		return nil, err
	}
	if err := s.db.Model(&product).Updates(values).Error; err != nil {
		return nil, err
	}
	if err := s.db.First(&product, id).Error; err != nil {
		return nil, err
	}
	return &product, nil
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
			product.ID = existing.ID
			if err := s.db.Model(&existing).Updates(map[string]interface{}{
				"name":        product.Name,
				"category":    product.Category,
				"description": product.Description,
				"image_url":   product.ImageURL,
				"price":       product.Price,
				"unit":        product.Unit,
				"is_active":   product.IsActive,
				"sort_order":  product.SortOrder,
			}).Error; err != nil {
				return err
			}
			continue
		}
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
