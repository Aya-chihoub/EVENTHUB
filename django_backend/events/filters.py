import django_filters
from .models import Event


class EventFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status', lookup_expr='exact')
    start_date_after = django_filters.DateTimeFilter(
        field_name='start_date', lookup_expr='gte'
    )
    start_date_before = django_filters.DateTimeFilter(
        field_name='start_date', lookup_expr='lte'
    )

    class Meta:
        model = Event
        fields = ['status', 'start_date_after', 'start_date_before']
