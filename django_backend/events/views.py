from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Event
from .serializers import EventListSerializer, EventDetailSerializer
from .filters import EventFilter
from .permissions import IsEditorOrReadOnly
from participants.serializers import ParticipantSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    permission_classes = [IsEditorOrReadOnly]
    filterset_class = EventFilter
    ordering_fields = ['start_date', 'title', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        return EventDetailSerializer

    @action(detail=True, methods=['get'], url_path='participants')
    def participants(self, request, pk=None):
        event = self.get_object()
        registrations = event.registrations.select_related('participant').exclude(
            status='cancelled'
        )
        participants = [reg.participant for reg in registrations]
        serializer = ParticipantSerializer(participants, many=True)
        return Response(serializer.data)
