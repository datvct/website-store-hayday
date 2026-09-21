package handlers

import (
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"hayday-order-system/backend/internal/httpx"
	"hayday-order-system/backend/internal/models"
	"hayday-order-system/backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type ProductHandler struct {
	service          *services.ProductService
	imageStorageHost string
	imageStorageBase string
	storageBucket    string
	storageClient    *minio.Client
}

func NewProductHandler(service *services.ProductService, imageStorageBaseURL string) *ProductHandler {
	storageHost := ""
	if parsed, err := url.Parse(imageStorageBaseURL); err == nil {
		storageHost = parsed.Hostname()
	}
	storageBucket := strings.TrimSpace(os.Getenv("S3_BUCKET"))
	if storageBucket == "" {
		storageBucket = "hayday-images"
	}
	storageClient := newStorageClient(imageStorageBaseURL, storageBucket)
	return &ProductHandler{
		service:          service,
		imageStorageHost: storageHost,
		imageStorageBase: strings.TrimRight(imageStorageBaseURL, "/"),
		storageBucket:    storageBucket,
		storageClient:    storageClient,
	}
}

func newStorageClient(baseURL, bucket string) *minio.Client {
	endpoint := strings.TrimSpace(os.Getenv("S3_ENDPOINT"))
	if endpoint == "" {
		endpoint = baseURL
	}
	parsed, err := url.Parse(endpoint)
	if err != nil || parsed.Host == "" {
		return nil
	}
	accessKey := strings.TrimSpace(os.Getenv("S3_ACCESS_KEY"))
	secretKey := strings.TrimSpace(os.Getenv("S3_SECRET_KEY"))
	if accessKey == "" || secretKey == "" {
		return nil
	}
	client, err := minio.New(parsed.Host, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: parsed.Scheme == "https",
	})
	if err != nil {
		return nil
	}
	return client
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
	categoryID, _ := strconv.ParseUint(c.Query("categoryId"), 10, 64)
	products, total, err := h.service.List(services.ProductFilter{
		Query:      c.Query("query"),
		Category:   c.Query("category"),
		CategoryID: uint(categoryID),
		Page:       page,
		Limit:      limit,
		Admin:      false,
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
	allowedWiki := imageURL != nil && imageURL.Scheme == "https" && (imageURL.Hostname() == "static.wikia.nocookie.net" || imageURL.Hostname() == "vignette.wikia.nocookie.net")
	allowedStorage := imageURL != nil && h.imageStorageHost != "" && imageURL.Hostname() == h.imageStorageHost
	if err != nil || (!allowedWiki && !allowedStorage) {
		httpx.Fail(c, http.StatusBadRequest, "Nguồn ảnh không hợp lệ")
		return
	}

	// Objects uploaded to MinIO are private by default. Read them with the
	// configured S3 credentials instead of making the bucket publicly readable.
	if allowedStorage {
		if h.storageClient == nil {
			httpx.Fail(c, http.StatusBadGateway, "Không thể kết nối MinIO")
			return
		}
		prefix := "/" + strings.Trim(h.storageBucket, "/") + "/"
		key := strings.TrimPrefix(imageURL.Path, prefix)
		if key == imageURL.Path || key == "" {
			httpx.Fail(c, http.StatusBadRequest, "Đường dẫn ảnh MinIO không hợp lệ")
			return
		}

		object, err := h.storageClient.GetObject(c.Request.Context(), h.storageBucket, key, minio.GetObjectOptions{})
		if err != nil {
			httpx.Fail(c, http.StatusBadGateway, "Không tải được ảnh sản phẩm")
			return
		}
		defer object.Close()
		info, err := object.Stat()
		if err != nil {
			httpx.Fail(c, http.StatusBadGateway, "Không tải được ảnh sản phẩm")
			return
		}
		c.Header("Cache-Control", "no-cache, must-revalidate")
		contentType := info.ContentType
		if contentType == "" {
			contentType = "application/octet-stream"
		}
		c.Header("Content-Type", contentType)
		_, _ = io.Copy(c.Writer, object)
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

	// The proxy URL is stable (/products/:id/image), while the underlying
	// object can change after an admin edit or a MinIO migration. Do not let a
	// browser keep serving the previous object for a full day.
	c.Header("Cache-Control", "no-cache, must-revalidate")
	c.Header("Content-Type", response.Header.Get("Content-Type"))
	_, _ = io.Copy(c.Writer, response.Body)
}

func (h *ProductHandler) AdminList(c *gin.Context) {
	page, limit := parsePageSize(c, 24, 100)
	categoryID, _ := strconv.ParseUint(c.Query("categoryId"), 10, 64)
	products, total, err := h.service.List(services.ProductFilter{
		Query:      c.Query("query"),
		Category:   c.Query("category"),
		CategoryID: uint(categoryID),
		Page:       page,
		Limit:      limit,
		Admin:      true,
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

func (h *ProductHandler) AdminUploadImage(c *gin.Context) {
	if h.storageClient == nil || h.imageStorageBase == "" {
		httpx.Fail(c, http.StatusServiceUnavailable, "MinIO chưa được cấu hình")
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))
	product, err := h.service.Get(uint(id), true)
	if err != nil {
		httpx.Fail(c, http.StatusNotFound, "Không tìm thấy sản phẩm")
		return
	}
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		httpx.Fail(c, http.StatusBadRequest, "Vui lòng chọn file ảnh")
		return
	}
	defer file.Close()
	if header.Size > 10*1024*1024 {
		httpx.Fail(c, http.StatusBadRequest, "Ảnh không được vượt quá 10MB")
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".png" && ext != ".jpg" && ext != ".jpeg" && ext != ".webp" {
		httpx.Fail(c, http.StatusBadRequest, "Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP")
		return
	}
	key := filepath.ToSlash(filepath.Join("products", strconv.FormatUint(uint64(product.ID), 10)+"-"+strconv.FormatInt(time.Now().UnixNano(), 10)+ext))
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	exists, err := h.storageClient.BucketExists(c.Request.Context(), h.storageBucket)
	if err != nil {
		httpx.Fail(c, http.StatusBadGateway, "Không thể kết nối MinIO")
		return
	}
	if !exists {
		if err := h.storageClient.MakeBucket(c.Request.Context(), h.storageBucket, minio.MakeBucketOptions{}); err != nil {
			httpx.Fail(c, http.StatusBadGateway, "Không thể tạo bucket MinIO")
			return
		}
	}
	if _, err := h.storageClient.PutObject(c.Request.Context(), h.storageBucket, key, file, header.Size, minio.PutObjectOptions{ContentType: contentType, CacheControl: "public, max-age=31536000, immutable"}); err != nil {
		httpx.Fail(c, http.StatusBadGateway, "Không thể upload ảnh lên MinIO")
		return
	}

	imageURL := h.imageStorageBase + "/" + key
	updated, err := h.service.Update(product.ID, map[string]interface{}{"image_url": imageURL})
	if err != nil {
		httpx.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.OK(c, updated)
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
