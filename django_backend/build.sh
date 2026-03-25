#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# Create or promote superuser from env vars
if [ -n "$DJANGO_SUPERUSER_USERNAME" ]; then
  python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')
django.setup()
from django.contrib.auth.models import User
u, created = User.objects.get_or_create(username='$DJANGO_SUPERUSER_USERNAME', defaults={'email': '$DJANGO_SUPERUSER_EMAIL'})
u.set_password('$DJANGO_SUPERUSER_PASSWORD')
u.is_staff = True
u.is_superuser = True
u.save()
print(f'Superuser {u.username} ready (created={created})')
"
fi
