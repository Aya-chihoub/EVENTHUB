from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/events/', include('events.urls')),
    path('api/participants/', include('participants.urls')),
    path('api/registrations/', include('registrations.urls')),
]
