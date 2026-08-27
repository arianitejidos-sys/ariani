from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, products, orders
from app.db.database import settings

app = FastAPI(
    title="Ariani API",
    description="API para Ariani — Productos tejidos a mano",
    version="1.0.0",
)

# CORS — permitir el frontend en desarrollo y producción (Vercel)
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["auth"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])

@app.get("/")
def root():
    return {"message": "Ariani API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}
