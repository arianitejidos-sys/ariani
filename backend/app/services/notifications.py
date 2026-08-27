import os
import logging
import httpx
from datetime import datetime
from app.db.database import settings

logger = logging.getLogger(__name__)

GOOGLE_APPS_SCRIPT_URL = settings.GOOGLE_APPS_SCRIPT_URL
ADMIN_EMAIL = settings.ADMIN_EMAIL
FRONTEND_URL = settings.FRONTEND_URL

ORDER_STATUS_LABELS = {
    "pendiente": "Pendiente",
    "cotizado_envio": "Cotizado Envío",
    "aceptado_por_cliente": "Aceptado por Cliente",
    "pago_realizado": "Pago Realizado",
    "en_proceso": "En Proceso",
    "entregado": "Entregado",
    "cerrado": "Cerrado",
    "cancelado_timeout": "Cancelado (Timeout)",
    "rechazado": "Rechazado",
}

def format_currency(price: float) -> str:
    return f"${int(price):,}".replace(",", ".")

def get_base_html_template(title: str, content_html: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            body {{
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #FDFBF7;
                color: #2D3748;
                margin: 0;
                padding: 0;
            }}
            .email-wrapper {{
                max-width: 600px;
                margin: 20px auto;
                background: #FFFFFF;
                border: 1px solid #E2E8F0;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }}
            .email-header {{
                background-color: #B5546A;
                padding: 30px;
                text-align: center;
                color: #FFFFFF;
            }}
            .email-header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: 1px;
            }}
            .email-header p {{
                margin: 5px 0 0 0;
                font-size: 14px;
                opacity: 0.9;
            }}
            .email-body {{
                padding: 30px;
                line-height: 1.6;
            }}
            .email-footer {{
                background-color: #F7FAFC;
                padding: 20px 30px;
                text-align: center;
                font-size: 12px;
                color: #A0AEC0;
                border-top: 1px solid #EDF2F7;
            }}
            .btn {{
                display: inline-block;
                padding: 12px 24px;
                background-color: #B5546A;
                color: #FFFFFF !important;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
                text-align: center;
            }}
            .btn-danger {{
                background-color: #E53E3E;
            }}
            .items-table {{
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }}
            .items-table th {{
                text-align: left;
                padding: 10px;
                background-color: #F7FAFC;
                border-bottom: 2px solid #E2E8F0;
                font-size: 13px;
                color: #4A5568;
            }}
            .items-table td {{
                padding: 12px 10px;
                border-bottom: 1px solid #EDF2F7;
                font-size: 14px;
            }}
            .total-row {{
                font-weight: bold;
                font-size: 16px;
                background-color: #F7FAFC;
            }}
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="email-header">
                <h1>ARIANI</h1>
                <p>Tejidos con amor a mano</p>
            </div>
            <div class="email-body">
                {content_html}
            </div>
            <div class="email-footer">
                <p>&copy; {datetime.now().year} Ariani. Todos los derechos reservados.</p>
                <p>Envíos únicamente al departamento del Atlántico.</p>
            </div>
        </div>
    </body>
    </html>
    """

def build_items_table(items: list) -> str:
    if not items:
        return ""
    
    rows = ""
    subtotal = 0
    for item in items:
        price = float(item.get("price", 0))
        qty = int(item.get("quantity", 1))
        item_total = price * qty
        subtotal += item_total
        rows += f"""
        <tr>
            <td>{item.get('name')}</td>
            <td>{qty}</td>
            <td>{format_currency(price)}</td>
            <td>{format_currency(item_total)}</td>
        </tr>
        """
    
    return f"""
    <table class="items-table">
        <thead>
            <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio Unit.</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {rows}
            <tr class="total-row">
                <td colspan="3" style="text-align: right; padding-right: 15px;">Subtotal:</td>
                <td>{format_currency(subtotal)}</td>
            </tr>
        </tbody>
    </table>
    """

def _send_payload(to_email: str, subject: str, body: str, html_body: str):
    if not GOOGLE_APPS_SCRIPT_URL:
        logger.warning("GOOGLE_APPS_SCRIPT_URL not configured – skipping email notification")
        return

    payload = {
        "to": to_email,
        "subject": subject,
        "body": body,
        "htmlBody": html_body
    }

    try:
        response = httpx.post(
            GOOGLE_APPS_SCRIPT_URL,
            json=payload,
            timeout=10.0,
            follow_redirects=True,
        )
        logger.info(f"Email sent to {to_email} – status {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

def notify_new_order(order):
    """Notify Customer and Ana about a new order."""
    # 1. Customer Email
    subject_client = "Recibimos tu pedido en Ariani ✨"
    
    items_html = ""
    if order.items:
        items_html = f"""
        <h3>Resumen del pedido:</h3>
        {build_items_table(order.items)}
        """
    elif order.custom_description:
        images_html = ""
        if order.reference_images:
            images_html = "<h3>Imágenes de referencia:</h3>" + "".join(
                f'<a href="{img}" target="_blank" style="margin-right: 10px;"><img src="{img}" width="80" height="80" style="object-fit:cover; border-radius:4px; border:1px solid #ccc;"/></a>' 
                for img in order.reference_images
            )
        items_html = f"""
        <h3>Pedido Personalizado:</h3>
        <p style="background: #F7FAFC; padding: 15px; border-radius: 8px; border-left: 4px solid #B5546A; font-style: italic;">
            "{order.custom_description}"
        </p>
        {images_html}
        """

    client_html = get_base_html_template(
        subject_client,
        f"""
        <h2>¡Hola {order.customer_name}!</h2>
        <p>Tu pedido ha sido recibido correctamente. Ana revisará los detalles y te enviará la cotización del envío lo antes posible.</p>
        {items_html}
        <p><strong>Dirección de entrega:</strong> {order.address}</p>
        <p>Te enviaremos un correo apenas definamos el costo del envío para que confirmes tu pedido. ¡Muchas gracias por tu compra!</p>
        """
    )
    _send_payload(order.customer_email, subject_client, "Recibimos tu pedido en Ariani. Pronto te contactaremos.", client_html)

    # 2. Ana Email
    subject_ana = f"Nuevo Pedido de {order.customer_name} 🛍️"
    ana_html = get_base_html_template(
        subject_ana,
        f"""
        <h2>¡Hola Ana!</h2>
        <p>Tienes un nuevo pedido pendiente por cotizar.</p>
        <p><strong>Cliente:</strong> {order.customer_name}<br/>
        <strong>WhatsApp:</strong> {order.customer_phone}<br/>
        <strong>Correo:</strong> {order.customer_email}<br/>
        <strong>Dirección:</strong> {order.address}</p>
        {items_html}
        <a href="{FRONTEND_URL}/dashboard" class="btn">Ir al Panel de Administración</a>
        """
    )
    _send_payload(ADMIN_EMAIL, subject_ana, f"Tienes un nuevo pedido de {order.customer_name} pendiente.", ana_html)

def notify_quote_sent(order):
    """Notify Customer with the shipping quote and confirmation links."""
    subject = "Cotización de envío lista para tu pedido en Ariani 📦"
    
    items_html = ""
    if order.items:
        items_html = build_items_table(order.items)
    
    accept_link = f"{FRONTEND_URL}/pedido/confirmar/{order.id}?action=accept"
    reject_link = f"{FRONTEND_URL}/pedido/confirmar/{order.id}?action=reject"
    
    total_con_envio = float(order.total_amount) + float(order.shipping_cost or 0)
    
    content = f"""
    <h2>¡Buenas noticias, {order.customer_name}!</h2>
    <p>Ana ha cotizado el envío para tu pedido.</p>
    <p><strong>Dirección de entrega:</strong> {order.address}</p>
    
    {items_html}
    
    <table class="items-table" style="margin-top: 0;">
        <tr>
            <td colspan="3" style="text-align: right; font-weight: bold;">Costo de Envío:</td>
            <td style="font-weight: bold; color: #B5546A;">{format_currency(order.shipping_cost)}</td>
        </tr>
        <tr class="total-row" style="background-color: #fcf1f3;">
            <td colspan="3" style="text-align: right;">Total Final:</td>
            <td style="color: #B5546A;">{format_currency(total_con_envio)}</td>
        </tr>
    </table>
    
    <p style="text-align: center; margin: 30px 0;">
        <a href="{accept_link}" class="btn" style="margin: 0 10px;">Aceptar Pedido</a>
        <a href="{reject_link}" class="btn btn-danger" style="margin: 0 10px;">Rechazar Pedido</a>
    </p>
    
    <p style="font-size: 13px; color: #718096; text-align: center;">
        * Al dar clic en "Aceptar Pedido", Ana recibirá una alerta y se comunicará contigo por correo electrónico para acordar el pago.
    </p>
    """
    client_html = get_base_html_template(subject, content)
    _send_payload(order.customer_email, subject, "Tu cotización de envío está lista. Acepta o rechaza el pedido.", client_html)

def notify_client_action(order, accepted: bool):
    """Notify Ana of client accept or reject action."""
    action_str = "ACEPTADO" if accepted else "RECHAZADO"
    subject = f"El cliente ha {action_str} el pedido - {order.customer_name} 📢"
    
    total_con_envio = float(order.total_amount) + float(order.shipping_cost or 0)
    
    content = f"""
    <h2>Acción del Cliente</h2>
    <p>El pedido del cliente <strong>{order.customer_name}</strong> ha sido <strong>{action_str}</strong>.</p>
    <p><strong>WhatsApp:</strong> {order.customer_phone}<br/>
    <strong>Correo:</strong> {order.customer_email}<br/>
    <strong>Dirección:</strong> {order.address}</p>
    
    <p><strong>Costo de Envío:</strong> {format_currency(order.shipping_cost or 0)}<br/>
    <strong>Total Final:</strong> {format_currency(total_con_envio)}</p>
    
    {"<p>Por favor, comunícate con el cliente por correo electrónico para coordinar el pago.</p>" if accepted else "<p>El pedido quedará registrado como rechazado y liberará el stock.</p>"}
    
    <a href="{FRONTEND_URL}/dashboard" class="btn">Ir al Panel de Administración</a>
    """
    html = get_base_html_template(subject, content)
    _send_payload(ADMIN_EMAIL, subject, f"El pedido de {order.customer_name} fue {action_str.lower()}.", html)

def notify_status_update(order):
    """Notify Customer about status updates from Ana."""
    status_label = ORDER_STATUS_LABELS.get(order.status.value if hasattr(order.status, 'value') else str(order.status), str(order.status))
    subject = f"Tu pedido ha cambiado de estado: {status_label} 👗"
    
    content = f"""
    <h2>¡Hola {order.customer_name}!</h2>
    <p>Te informamos que tu pedido ha sido actualizado al estado: <strong>{status_label}</strong>.</p>
    <p>Ana se pondrá en contacto contigo por correo electrónico si es necesario.</p>
    
    <div style="background-color: #F7FAFC; padding: 20px; border-radius: 8px; border: 1px dashed #E2E8F0; margin: 20px 0;">
        <strong>Detalles del Envío:</strong><br/>
        Dirección: {order.address}<br/>
        Teléfono de contacto: {order.customer_phone}
    </div>
    """
    html = get_base_html_template(subject, content)
    _send_payload(order.customer_email, subject, f"Tu pedido cambió a: {status_label}.", html)
