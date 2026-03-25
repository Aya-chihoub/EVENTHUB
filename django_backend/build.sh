#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# Create default users (SQLite is ephemeral on Render free tier)
python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')
django.setup()
from django.contrib.auth.models import User, Group

# Editor group
editor_group, _ = Group.objects.get_or_create(name='editor')

# Admin/editor user
su = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@eventhub.com')
pw = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin1234')
u, created = User.objects.get_or_create(username=su, defaults={'email': email})
u.set_password(pw)
u.is_staff = True
u.is_superuser = True
u.save()
print(f'Editor {u.username} ready (created={created})')

# Viewer user
v, created = User.objects.get_or_create(username='viewer', defaults={'email': 'viewer@eventhub.com'})
v.set_password('viewer1234')
v.save()
print(f'Viewer {v.username} ready (created={created})')
"
