import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';

const intervalOptions = [
  { label: 'Every 1 minute', value: 60 },
  { label: 'Every 5 minutes', value: 300 },
  { label: 'Every 10 minutes', value: 600 },
  { label: 'Every 30 minutes', value: 1800 },
  { label: 'Every 60 minutes', value: 3600 },
];

const timeoutOptions = [
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
  { label: '30 seconds', value: 30000 },
  { label: '60 seconds', value: 60000 },
];

const MonitorForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'GET',
    interval: 300,
    timeout: 10000,
    body: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        url: initialData.url || '',
        method: initialData.method || 'GET',
        interval: initialData.interval || 300,
        timeout: initialData.timeout || 10000,
        body: typeof initialData.body === 'string'
          ? initialData.body
          : initialData.body ? JSON.stringify(initialData.body, null, 2) : '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Monitor name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Monitor name must be at least 2 characters';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'Endpoint URL is required';
    } else {
      try {
        const parsed = new URL(formData.url.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          newErrors.url = 'URL must begin with http:// or https://';
        }
      } catch {
        newErrors.url = 'Please provide a valid URL (e.g. https://api.example.com/health)';
      }
    }

    if ((formData.method === 'POST' || formData.method === 'PUT') && formData.body.trim()) {
      try {
        JSON.parse(formData.body);
      } catch {
        newErrors.body = 'Request body must be valid JSON';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      url: formData.url.trim(),
      method: formData.method,
      interval: Number(formData.interval),
      timeout: Number(formData.timeout),
      body:
        (formData.method === 'POST' || formData.method === 'PUT') && formData.body.trim()
          ? formData.body.trim()
          : undefined,
    };

    onSubmit(payload);
  };

  const showBody = formData.method === 'POST' || formData.method === 'PUT';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Monitor Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g. Production API Gateway"
        error={errors.name}
        required
      />

      <Input
        label="Target URL"
        name="url"
        value={formData.url}
        onChange={handleChange}
        placeholder="https://example.com/api/health"
        helperText="Must include http:// or https://"
        error={errors.url}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Method */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            HTTP Method
          </label>
          <select
            name="method"
            value={formData.method}
            onChange={handleChange}
            className="w-full bg-navy-800 border border-navy-500 text-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="HEAD">HEAD</option>
            <option value="PUT">PUT</option>
          </select>
        </div>

        {/* Interval */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Check Frequency
          </label>
          <select
            name="interval"
            value={formData.interval}
            onChange={handleChange}
            className="w-full bg-navy-800 border border-navy-500 text-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          >
            {intervalOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Timeout */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Timeout
          </label>
          <select
            name="timeout"
            value={formData.timeout}
            onChange={handleChange}
            className="w-full bg-navy-800 border border-navy-500 text-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          >
            {timeoutOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional Request Body */}
      {showBody && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Request Body (JSON)
          </label>
          <textarea
            name="body"
            rows={4}
            value={formData.body}
            onChange={handleChange}
            placeholder='{"key": "value"}'
            className={`w-full bg-navy-800 border ${
              errors.body ? 'border-red-500' : 'border-navy-500'
            } text-slate-200 font-mono text-xs placeholder-slate-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all`}
          />
          {errors.body && <p className="mt-1 text-xs text-red-400">{errors.body}</p>}
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-600">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          {initialData ? 'Save Changes' : 'Create Monitor'}
        </Button>
      </div>
    </form>
  );
};

export default MonitorForm;
