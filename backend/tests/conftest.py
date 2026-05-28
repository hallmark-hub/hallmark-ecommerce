import os


os.environ["APP_ENV"] = "test"

for key in [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PAYSTACK_SECRET_KEY",
    "PAYSTACK_PUBLIC_KEY",
    "AT_API_KEY",
    "AT_USERNAME",
    "AT_SENDER_ID",
    "ADMIN_NOTIFICATION_PHONE",
    "ADMIN_API_KEY",
]:
    os.environ[key] = ""
