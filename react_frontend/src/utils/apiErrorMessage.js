/**
 * Normalize Django REST Framework and Node/Express error bodies into readable text.
 */
function normalizeDetail(detail) {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'string' in item) return item.string;
        return null;
      })
      .filter(Boolean)
      .join(' ');
  }
  if (typeof detail === 'object') return JSON.stringify(detail);
  return String(detail);
}

export function getApiErrorMessage(error, fallback = 'Something went wrong.') {
  if (!error?.response) {
    if (error?.message === 'Network Error') {
      return 'Cannot reach the server. Check your connection and API URL.';
    }
    return error?.message || fallback;
  }

  const { data, status } = error.response;

  if (data == null || data === '') {
    if (status === 404) return 'Resource not found.';
    if (status === 403) return 'You do not have permission to do that.';
    if (status === 401) return 'Please sign in again.';
    if (status === 409) return 'This action conflicts with the current data.';
    if (status >= 500) return 'Server error. Please try again later.';
    return fallback;
  }

  if (typeof data === 'string') return data;

  if (typeof data.error === 'string') {
    if (Array.isArray(data.details) && data.details.length) {
      return [...data.details].filter(Boolean).join(' ');
    }
    return data.error;
  }

  if (data.detail != null) {
    const d = normalizeDetail(data.detail);
    if (d) return d;
  }

  if (Array.isArray(data.errors)) {
    const msgs = data.errors.map((e) => e.msg || e.message || String(e)).filter(Boolean);
    if (msgs.length) return msgs.join(' ');
  }

  if (data.non_field_errors) {
    const arr = Array.isArray(data.non_field_errors) ? data.non_field_errors : [data.non_field_errors];
    return arr.join(' ');
  }

  const skip = new Set(['detail', 'non_field_errors', 'error', 'errors']);
  const fieldParts = [];
  for (const [key, val] of Object.entries(data)) {
    if (skip.has(key)) continue;
    if (val == null) continue;
    const label = key.replace(/_/g, ' ');
    if (Array.isArray(val)) fieldParts.push(`${label}: ${val.join(', ')}`);
    else if (typeof val === 'object') fieldParts.push(`${label}: ${JSON.stringify(val)}`);
    else fieldParts.push(`${label}: ${val}`);
  }
  if (fieldParts.length) return fieldParts.join('\n');

  return fallback;
}
