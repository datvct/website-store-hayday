package services

import (
	"fmt"
	"strings"

	"hayday-order-system/backend/internal/models"

	"gorm.io/gorm"
)

type CategoryService struct {
	db *gorm.DB
}

func NewCategoryService(db *gorm.DB) *CategoryService {
	return &CategoryService{db: db}
}

func (s *CategoryService) List(admin bool) ([]models.Category, error) {
	query := s.db.Order("name ASC")
	if !admin {
		query = query.Where("is_active = ?", true)
	}
	var categories []models.Category
	if err := query.Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

func (s *CategoryService) Create(name string) (*models.Category, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, fmt.Errorf("tên danh mục không được để trống")
	}
	var existing models.Category
	if err := s.db.Where("LOWER(name) = LOWER(?)", name).First(&existing).Error; err == nil {
		return nil, fmt.Errorf("tên danh mục này đã tồn tại")
	} else if err != gorm.ErrRecordNotFound {
		return nil, err
	}
	category := &models.Category{Name: name, IsActive: true}
	if err := s.db.Create(category).Error; err != nil {
		if strings.Contains(err.Error(), "idx_categories_name") || strings.Contains(err.Error(), "duplicate key") {
			return nil, fmt.Errorf("tên danh mục này đã tồn tại")
		}
		return nil, err
	}
	return category, nil
}

func (s *CategoryService) Update(id uint, name string, isActive bool) (*models.Category, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, fmt.Errorf("tên danh mục không được để trống")
	}
	var category models.Category
	if err := s.db.First(&category, id).Error; err != nil {
		return nil, err
	}
	var existing models.Category
	if err := s.db.Where("LOWER(name) = LOWER(?) AND id <> ?", name, id).First(&existing).Error; err == nil {
		return nil, fmt.Errorf("tên danh mục này đã tồn tại")
	} else if err != gorm.ErrRecordNotFound {
		return nil, err
	}
	oldName := category.Name
	tx := s.db.Begin()
	if err := tx.Model(&category).Updates(map[string]interface{}{"name": name, "is_active": isActive}).Error; err != nil {
		tx.Rollback()
		if strings.Contains(err.Error(), "idx_categories_name") || strings.Contains(err.Error(), "duplicate key") {
			return nil, fmt.Errorf("tên danh mục này đã tồn tại")
		}
		return nil, err
	}
	if oldName != name {
		if err := tx.Model(&models.Product{}).Where("category_id = ?", category.ID).Update("category", name).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}
	return &category, s.db.First(&category, id).Error
}

func (s *CategoryService) Delete(id uint) error {
	var category models.Category
	if err := s.db.First(&category, id).Error; err != nil {
		return err
	}
	var count int64
	if err := s.db.Model(&models.Product{}).Where("category_id = ?", category.ID).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("không thể xoá danh mục đang có %d sản phẩm", count)
	}
	return s.db.Delete(&category).Error
}

// SyncProductCategories is an idempotent data migration. It makes every
// product.category point to the canonical name in categories, creates missing
// categories, and gives products with an empty category a safe fallback.
func (s *CategoryService) SyncProductCategories() (int, error) {
	tx := s.db.Begin()
	if tx.Error != nil {
		return 0, tx.Error
	}
	var products []models.Product
	if err := tx.Select("id, category, category_id").Find(&products).Error; err != nil {
		tx.Rollback()
		return 0, err
	}
	updated := 0
	for _, product := range products {
		name := strings.TrimSpace(product.Category)
		if name == "" {
			name = "Chưa phân loại"
		}
		var category models.Category
		err := tx.Where("LOWER(name) = LOWER(?)", name).First(&category).Error
		if err == gorm.ErrRecordNotFound {
			category = models.Category{Name: name, IsActive: true}
			if err := tx.Create(&category).Error; err != nil {
				tx.Rollback()
				return 0, err
			}
		} else if err != nil {
			tx.Rollback()
			return 0, err
		}
		if product.Category != category.Name || product.CategoryID != category.ID {
			if err := tx.Model(&models.Product{}).Where("id = ?", product.ID).Updates(map[string]interface{}{"category": category.Name, "category_id": category.ID}).Error; err != nil {
				tx.Rollback()
				return 0, err
			}
			updated++
		}
	}
	if err := tx.Commit().Error; err != nil {
		return 0, err
	}
	return updated, nil
}
