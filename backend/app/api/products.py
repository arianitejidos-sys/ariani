from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
import cloudinary
import cloudinary.uploader
from sqlalchemy.orm import Session
from uuid import UUID
from urllib.parse import urlparse, unquote

from app.api.deps import get_db, get_current_user
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.db.database import settings

router = APIRouter()

@router.post("/upload-image")
def upload_product_image(
    image: UploadFile = File(...),
):
    """Upload a product image to Cloudinary and return its secure URL."""
    if not settings.CLOUDINARY_URL:
        raise HTTPException(status_code=503, detail="Cloudinary no está configurado")
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    cloudinary_url = urlparse(settings.CLOUDINARY_URL)
    if cloudinary_url.scheme != "cloudinary" or not all(
        (cloudinary_url.hostname, cloudinary_url.username, cloudinary_url.password)
    ):
        raise HTTPException(status_code=503, detail="La configuración de Cloudinary no es válida")

    cloudinary.config(
        cloud_name=cloudinary_url.hostname,
        api_key=unquote(cloudinary_url.username),
        api_secret=unquote(cloudinary_url.password),
        secure=True,
    )
    try:
        result = cloudinary.uploader.upload(
            image.file,
            folder="ariani/products",
            resource_type="image",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"No se pudo subir la imagen a Cloudinary: {str(exc)}",
        ) from exc

    return {"image_url": result["secure_url"], "public_id": result["public_id"]}

@router.get("/", response_model=List[ProductResponse])
def read_products(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None
):
    """
    Retrieve products. Publicly accessible.
    """
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    products = query.offset(skip).limit(limit).all()
    return products

@router.get("/{id}", response_model=ProductResponse)
def read_product(id: UUID, db: Session = Depends(get_db)):
    """
    Get a specific product by ID. Public.
    """
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new product. Restricted to Ana.
    """
    product = Product(**product_in.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/{id}", response_model=ProductResponse)
def update_product(
    id: UUID,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a product. Restricted to Ana.
    """
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
        
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{id}", response_model=ProductResponse)
def delete_product(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a product. Restricted to Ana.
    """
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    db.delete(product)
    db.commit()
    return product
