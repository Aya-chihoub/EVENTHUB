from django.db import models
from events.models import Event
from participants.models import Participant


class Registration(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='registrations'
    )
    participant = models.ForeignKey(
        Participant, on_delete=models.CASCADE, related_name='registrations'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'participant')
        ordering = ['-registered_at']

    def __str__(self):
        return f'{self.participant} → {self.event} ({self.status})'
