import os
import sys
from pydantic_settings import BaseSettings
import cloudinary
import cloudinary.uploader
from urllib.parse import urlparse, unquote

class Settings(BaseSettings):
    CLOUDINARY_URL: str = ""
    class Config:
        env_file = ".env"

settings = Settings()

if not settings.CLOUDINARY_URL:
    print("No CLOUDINARY_URL")
    sys.exit(1)

cloudinary_url = urlparse(settings.CLOUDINARY_URL)
cloudinary.config(
    cloud_name=cloudinary_url.hostname,
    api_key=unquote(cloudinary_url.username),
    api_secret=unquote(cloudinary_url.password),
    secure=True,
)

# create a dummy image file
with open("dummy.txt", "w") as f:
    f.write("not really an image")

try:
    result = cloudinary.uploader.upload(
        "dummy.txt",
        folder="ariani/products",
        resource_type="auto",
    )
    print("Success:", result)
except Exception as e:
    print("Cloudinary error:", type(e))
    print(str(e))
