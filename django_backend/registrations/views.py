from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Registration
from .serializers import RegistrationSerializer
from events.permissions import IsEditorOrReadOnly


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related('event', 'participant').all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsEditorOrReadOnly]
    filterset_fields = ['event', 'participant', 'status']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
