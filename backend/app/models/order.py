import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Numeric, Text, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.database import Base

class OrderType(str, enum.Enum):
    catalog = "catalog"
    pet_catalog = "pet_catalog"
    custom = "custom"

class OrderStatus(str, enum.Enum):
    pendiente = "pendiente"
    cotizado_envio = "cotizado_envio"
    aceptado_por_cliente = "aceptado_por_cliente"
    pago_realizado = "pago_realizado"
    en_proceso = "en_proceso"
    entregado = "entregado"
    cerrado = "cerrado"
    cancelado_timeout = "cancelado_timeout"
    rechazado = "rechazado"

class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    
    # Solo departamento del Atlantico (regla de negocio a validar en la API)
    address = Column(String, nullable=False)
    
    order_type = Column(Enum(OrderType), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.pendiente, nullable=False)
    
    # Costo de envio calculado por Ana. Puede ser nulo inicialmente
    shipping_cost = Column(Numeric(10, 2), nullable=True)
    
    total_amount = Column(Numeric(10, 2), nullable=False)
    
    # Detalle de los productos comprados (carrito)
    items = Column(JSONB, nullable=True)
    
    # Para pedidos personalizados (URLs de Cloudinary)
    reference_images = Column(JSONB, nullable=True)
    custom_description = Column(Text, nullable=True)
    
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    # 7 dias despues de delivered_at, para borrado de imagenes
    retention_until = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
