from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'start_date', 'end_date', 'max_participants', 'participant_count')
    list_filter = ('status', 'start_date')
    search_fields = ('title', 'location')
    readonly_fields = ('created_at', 'updated_at', 'participant_count')
