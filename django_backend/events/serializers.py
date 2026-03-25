from rest_framework import serializers
from .models import Event


class EventListSerializer(serializers.ModelSerializer):
    participant_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'location',
            'start_date', 'end_date', 'max_participants',
            'status', 'participant_count', 'is_full',
            'created_at', 'updated_at',
        ]


class EventDetailSerializer(serializers.ModelSerializer):
    participant_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'location',
            'start_date', 'end_date', 'max_participants',
            'status', 'participant_count', 'is_full',
            'created_at', 'updated_at',
        ]

    def validate(self, data):
        start = data.get('start_date', getattr(self.instance, 'start_date', None))
        end = data.get('end_date', getattr(self.instance, 'end_date', None))
        if start and end and end <= start:
            raise serializers.ValidationError(
                {'end_date': 'End date must be after start date.'}
            )
        return data
