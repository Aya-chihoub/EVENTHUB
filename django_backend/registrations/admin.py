from django.contrib import admin
from .models import Registration


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('id', 'event', 'participant', 'status', 'registered_at')
    list_filter = ('status', 'event')
    search_fields = (
        'event__title',
        'participant__first_name',
        'participant__last_name',
    )
    raw_id_fields = ('event', 'participant')
