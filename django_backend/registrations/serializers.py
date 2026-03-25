from rest_framework import serializers
from .models import Registration
from events.models import Event
from participants.models import Participant


class RegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    participant_name = serializers.SerializerMethodField()

    class Meta:
        model = Registration
        fields = [
            'id', 'event', 'participant',
            'event_title', 'participant_name',
            'status', 'registered_at',
        ]
        read_only_fields = ['registered_at']

    def get_participant_name(self, obj):
        return f'{obj.participant.first_name} {obj.participant.last_name}'

    def validate(self, data):
        event = data.get('event') or (self.instance.event if self.instance else None)
        participant = data.get('participant') or (
            self.instance.participant if self.instance else None
        )

        if event and event.status in ('cancelled', 'completed'):
            raise serializers.ValidationError(
                {'event': f'Cannot register for an event with status "{event.status}".'}
            )

        # Duplicate check (only on create)
        if not self.instance and event and participant:
            if Registration.objects.filter(event=event, participant=participant).exists():
                raise serializers.ValidationError(
                    {'non_field_errors': 'This participant is already registered for this event.'}
                )

        # Capacity check (only on create, skip cancelled registrations in count)
        if not self.instance and event and event.max_participants is not None:
            active = Registration.objects.filter(event=event).exclude(
                status='cancelled'
            ).count()
            if active >= event.max_participants:
                raise serializers.ValidationError(
                    {'event': 'This event has reached its maximum number of participants.'}
                )

        return data
