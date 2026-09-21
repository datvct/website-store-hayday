"""Download catalog images once, upload them to S3/MinIO, and update PostgreSQL."""

import mimetypes
import json
import os
import re
import unicodedata
from urllib.parse import urlparse

import boto3
import psycopg2
import requests
from botocore.client import Config


def env(name, fallback=""):
    return os.getenv(name, fallback).strip()


def slug(value):
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "product"


def content_type(response, source):
    value = response.headers.get("content-type", "").split(";")[0]
    return value if value.startswith("image/") else mimetypes.guess_type(urlparse(source).path)[0] or "image/png"


def main():
    endpoint = env("S3_ENDPOINT", "http://localhost:9000")
    access_key = env("S3_ACCESS_KEY", "hayday_minio")
    secret_key = env("S3_SECRET_KEY", "hayday_minio_password")
    bucket = env("S3_BUCKET", "hayday-images")
    seed_file = env("SEED_PRODUCTS_FILE", "backend/seeds/products.json")
    public_base = env("IMAGE_STORAGE_BASE_URL", f"{endpoint}/{bucket}").rstrip("/")
    s3 = boto3.client("s3", endpoint_url=endpoint, aws_access_key_id=access_key, aws_secret_access_key=secret_key, config=Config(signature_version="s3v4"))
    try:
        s3.head_bucket(Bucket=bucket)
    except Exception:
        s3.create_bucket(Bucket=bucket)
    try:
        s3.put_bucket_policy(Bucket=bucket, Policy='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::' + bucket + '/*"]}]}')
    except Exception:
        print("Warning: bucket policy was not changed; backend must be allowed to read objects.")

    conn = psycopg2.connect(host=env("DB_HOST", "127.0.0.1"), port=env("DB_PORT", "5433"), dbname=env("POSTGRES_DB", "hayday"), user=env("POSTGRES_USER", "hayday"), password=env("POSTGRES_PASSWORD", "hayday_dev_password"))
    conn.autocommit = False
    rows = conn.cursor()
    source_by_title = {}
    if os.path.exists(seed_file):
        with open(seed_file, encoding="utf-8") as source:
            source_by_title = {
                item.get("sourceTitle", ""): item.get("imageUrl", "")
                for item in json.load(source)
                if item.get("sourceTitle") and item.get("imageUrl")
            }

    rows.execute("SELECT id, source_title, name, image_url FROM products ORDER BY id")
    products = rows.fetchall()
    updated = 0
    skipped = 0
    for product_id, source_title, name, image_url in products:
        if not image_url or image_url.startswith("s3://"):
            skipped += 1
            continue
        if "/hayday-images/" in image_url:
            image_url = source_by_title.get(source_title, "")
            if not image_url:
                skipped += 1
                print(f"SKIP {product_id} {name}: no source image URL")
                continue
        try:
            response = requests.get(image_url, timeout=25)
            response.raise_for_status()
            extension = mimetypes.guess_extension(content_type(response, image_url)) or ".png"
            key = f"products/{slug(name)}-{product_id}{extension}"
            s3.put_object(Bucket=bucket, Key=key, Body=response.content, ContentType=content_type(response, image_url), CacheControl="public, max-age=31536000, immutable")
            new_url = f"{public_base}/{key}"
            rows.execute("UPDATE products SET image_url = %s, updated_at = NOW() WHERE id = %s", (new_url, product_id))
            conn.commit()
            updated += 1
            print(f"[{updated}] {name} -> {new_url}")
        except Exception as error:
            conn.rollback()
            print(f"SKIP {product_id} {name}: {error}")
    conn.close()
    print(f"Completed: updated={updated}, skipped={skipped}, total={len(products)}")


if __name__ == "__main__":
    main()
