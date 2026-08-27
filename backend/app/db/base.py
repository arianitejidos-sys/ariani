from app.db.database import Base
from app.models.user import User
from app.models.product import Product
from app.models.order import Order

# Import all the models, so that Base has them before being
# imported by Alembic
