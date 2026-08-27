from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timedelta

from app.api.deps import get_db, get_current_user
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse
from app.services.notifications import (
    notify_new_order,
    notify_quote_sent,
    notify_client_action,
    notify_status_update,
)

router = APIRouter()

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new order. Publicly accessible.
    Address validation (Atlantico) is handled in the Pydantic schema validator.
    If items are provided, validate stock and deduct accordingly.
    """
    # Validate and deduct stock for cart items
    if order_in.items:
        for item in order_in.items:
            product_id = item.get("product_id")
            quantity = item.get("quantity", 1)
            if not product_id:
                raise HTTPException(status_code=400, detail="Cada item debe tener un product_id")
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Producto no encontrado: {product_id}")
            if product.stock < quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente para \"{product.name}\". Disponible: {product.stock}, solicitado: {quantity}"
                )
            product.stock -= quantity

    order = Order(
        **order_in.dict(),
        status=OrderStatus.pendiente
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Notify about new order
    try:
        notify_new_order(order)
    except Exception as e:
        # Prevent email failures from breaking the response
        pass
        
    return order

@router.get("/", response_model=List[OrderResponse])
def read_orders(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """
    List all orders. Restricted to Ana.
    """
    orders = db.query(Order).offset(skip).limit(limit).all()
    return orders

@router.get("/{id}", response_model=OrderResponse)
def read_order(
    id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get order details. Restricted to Ana.
    """
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{id}", response_model=OrderResponse)
def update_order(
    id: UUID,
    order_in: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update order status or shipping cost. Restricted to Ana.
    Handles 'delivered_at' -> 'retention_until' automatically.
    """
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status
    update_data = order_in.dict(exclude_unset=True)
    
    # If updating status to entregado and delivered_at is not provided, set it now.
    if update_data.get('status') == OrderStatus.entregado and not order.delivered_at:
        order.delivered_at = datetime.utcnow()
        
    for key, value in update_data.items():
        setattr(order, key, value)
        
    # Logic for retention_until
    if order.delivered_at and not order.retention_until:
        order.retention_until = order.delivered_at + timedelta(days=7)

    db.add(order)
    db.commit()
    db.refresh(order)

    # Status transitions / Notification triggers
    new_status = order.status
    if new_status != old_status:
        try:
            if new_status == OrderStatus.cotizado_envio:
                notify_quote_sent(order)
            else:
                notify_status_update(order)
        except Exception as e:
            pass

    return order

@router.post("/{id}/client-confirm", response_model=OrderResponse)
def client_confirm_order(
    id: UUID,
    action: str,  # "accept" or "reject"
    db: Session = Depends(get_db)
):
    """
    Public endpoint for clients to accept or reject the shipping quote.
    """
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    if order.status != OrderStatus.cotizado_envio:
        raise HTTPException(
            status_code=400,
            detail=f"Este pedido no está en estado de cotización. Estado actual: {order.status.value}"
        )
    
    if action == "accept":
        order.status = OrderStatus.aceptado_por_cliente
        db.add(order)
        db.commit()
        db.refresh(order)
        try:
            notify_client_action(order, accepted=True)
        except Exception:
            pass
    elif action == "reject":
        order.status = OrderStatus.rechazado
        # Restore stock of products
        if order.items:
            for item in order.items:
                product_id = item.get("product_id")
                quantity = item.get("quantity", 1)
                if product_id:
                    product = db.query(Product).filter(Product.id == product_id).first()
                    if product:
                        product.stock += quantity
        db.add(order)
        db.commit()
        db.refresh(order)
        try:
            notify_client_action(order, accepted=False)
        except Exception:
            pass
    else:
        raise HTTPException(status_code=400, detail="Acción no válida. Debe ser 'accept' o 'reject'")
        
    return order

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete/archive a finished order. Restricted to Ana.
    Only allows deletion of orders with terminal statuses.
    """
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    terminal_statuses = [
        OrderStatus.entregado,
        OrderStatus.cerrado,
        OrderStatus.cancelado_timeout,
        OrderStatus.rechazado,
    ]
    if order.status not in terminal_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Solo se pueden archivar pedidos finalizados. Estado actual: {order.status.value}"
        )
    
    db.delete(order)
    db.commit()
    return None

@router.post("/{id}/pay-success", response_model=OrderResponse)
def order_payment_success(
    id: UUID,
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """
    Public endpoint called by the frontend when payment is approved.
    Updates status to pago_realizado and notifies customer.
    """
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
    if order.status in [OrderStatus.pendiente, OrderStatus.cotizado_envio, OrderStatus.aceptado_por_cliente]:
        order.status = OrderStatus.pago_realizado
        db.add(order)
        db.commit()
        db.refresh(order)
        try:
            notify_status_update(order)
        except Exception:
            pass
            
    return order

@router.post("/wompi-webhook")
def wompi_webhook(
    payload: dict,
    db: Session = Depends(get_db)
):
    """
    Webhook receiver for Wompi transactions.
    Parses status changes and updates corresponding order.
    """
    event = payload.get("event")
    if event == "transaction.updated":
        transaction = payload.get("data", {}).get("transaction", {})
        status = transaction.get("status")
        reference = transaction.get("reference")
        
        # Wompi reference format: ARIANI-{uuid}
        order_id_str = reference.replace("ARIANI-", "")
        try:
            order_id = UUID(order_id_str)
        except ValueError:
            return {"status": "ignored", "detail": "Invalid reference format"}
            
        order = db.query(Order).filter(Order.id == order_id).first()
        if order and status == "APPROVED":
            if order.status in [OrderStatus.pendiente, OrderStatus.cotizado_envio, OrderStatus.aceptado_por_cliente]:
                order.status = OrderStatus.pago_realizado
                db.add(order)
                db.commit()
                db.refresh(order)
                try:
                    notify_status_update(order)
                except Exception:
                    pass
                return {"status": "success", "detail": "Order marked as paid"}
            
    return {"status": "ignored"}


