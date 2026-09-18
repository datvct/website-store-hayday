package router

import (
	"hayday-order-system/backend/internal/handlers"
	"hayday-order-system/backend/internal/middleware"
	"hayday-order-system/backend/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Handlers struct {
	Auth  *handlers.AuthHandler
	Prod  *handlers.ProductHandler
	Order *handlers.OrderHandler
}

func New(
	authService *services.AuthService,
	productService *services.ProductService,
	categoryService *services.CategoryService,
	orderService *services.OrderService,
	frontendOrigin string,
	imageStorageBaseURL string,
) *gin.Engine {
	r := gin.Default()
	allowedOrigins := []string{"http://localhost:5173", "http://127.0.0.1:5173"}
	if frontendOrigin != "" {
		allowedOrigins = append(allowedOrigins, frontendOrigin)
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	authHandler := handlers.NewAuthHandler(authService)
	productHandler := handlers.NewProductHandler(productService, imageStorageBaseURL)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	orderHandler := handlers.NewOrderHandler(orderService)

	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"success": true}) })
		api.GET("/settings/public", func(c *gin.Context) { c.JSON(200, gin.H{"success": true, "data": gin.H{}}) })

		api.GET("/products", productHandler.PublicList)
		api.GET("/products/:id/image", productHandler.Image)
		api.GET("/products/:id", productHandler.PublicGet)
		api.GET("/categories", categoryHandler.List)
		api.POST("/orders", orderHandler.Create)
		api.GET("/orders/track", orderHandler.Track)
		api.POST("/admin/auth/login", authHandler.Login)

		admin := api.Group("/admin")
		admin.Use(middleware.RequireAdminAuth(authService))
		{
			admin.GET("/me", authHandler.Me)

			admin.GET("/products", productHandler.AdminList)
			admin.POST("/products", productHandler.AdminCreate)
			admin.PUT("/products/:id", productHandler.AdminUpdate)
			admin.POST("/products/:id/image", productHandler.AdminUploadImage)
			admin.DELETE("/products/:id", productHandler.AdminDelete)
			admin.GET("/categories", categoryHandler.AdminList)
			admin.POST("/categories", categoryHandler.Create)
			admin.PUT("/categories/:id", categoryHandler.Update)
			admin.DELETE("/categories/:id", categoryHandler.Delete)

			admin.GET("/orders", orderHandler.AdminList)
			admin.GET("/orders/:id", orderHandler.AdminGet)
			admin.PATCH("/orders/:id/status", orderHandler.AdminUpdateStatus)
			admin.GET("/stats", orderHandler.Stats)
		}
	}

	return r
}
