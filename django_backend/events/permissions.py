from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsEditorOrReadOnly(BasePermission):
    """
    Editors (is_staff=True or member of 'editor' group) get full access.
    Everyone else is read-only.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return _is_editor(request.user)


def _is_editor(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    return user.groups.filter(name='editor').exists()
