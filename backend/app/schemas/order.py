from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from uuid import UUID
from app.models.order import OrderType, OrderStatus

class OrderBase(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    address: str
    order_type: OrderType
    total_amount: float
    items: Optional[List[Dict[str, Any]]] = None
    reference_images: Optional[List[str]] = None
    custom_description: Optional[str] = None

class OrderCreate(OrderBase):
    @validator("address")
    def validate_address_department(cls, v):
        # We enforce "Solo departamento del Atlantico"
        # Since it's a string, we might just check if it contains 'atlantico' 
        # or rely on frontend + backend explicit check.
        # For MVP, we simply ensure it's provided. The real check can be a specific field 
        # but the document says "restringir explícitamente el checkout a esta zona".
        # We will do a basic keyword check or just leave it to the frontend to pass a department field,
        # but the schema only has 'address'. We will assume 'atlantico' must be in the address or 
        # we strictly validate it in the endpoint if needed.
        if "atlantico" not in v.lower() and "atlántico" not in v.lower():
            raise ValueError("El envío solo está disponible para el departamento del Atlántico")
        return v

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    shipping_cost: Optional[float] = None
    delivered_at: Optional[datetime] = None
    # Ana doesn't update retention_until manually, it's calculated.

class OrderResponse(OrderBase):
    id: UUID
    status: OrderStatus
    shipping_cost: Optional[float] = None
    delivered_at: Optional[datetime] = None
    retention_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
