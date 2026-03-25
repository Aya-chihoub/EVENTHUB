from rest_framework import viewsets
from .models import Participant
from .serializers import ParticipantSerializer
from events.permissions import IsEditorOrReadOnly


class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    permission_classes = [IsEditorOrReadOnly]
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['last_name', 'first_name', 'email']
