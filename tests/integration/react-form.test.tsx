import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { v, validateForm } from '../../src';

const formSchema = v.object({
  username: v.string().min(3, 'Username must be at least 3 characters'),
  email: v.string().email('Please enter a valid email address'),
  age: v.number().min(18, 'Must be at least 18 years old'),
  agreeToTerms: v.boolean(),
});

function RegistrationForm({ onSubmitSuccess }: { onSubmitSuccess: (data: any) => void }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    age: '',
    agreeToTerms: 'off',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateForm(formSchema, formData);

    if (!result.success) {
      setErrors(result.errors.fieldErrors || {});
      setIsSuccess(false);
    } else {
      setErrors({});
      setIsSuccess(true);
      onSubmitSuccess(result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="registration-form">
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        {errors.username && <span data-testid="error-username">{errors.username[0]}</span>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        {errors.email && <span data-testid="error-email">{errors.email[0]}</span>}
      </div>

      <div>
        <label htmlFor="age">Age</label>
        <input
          id="age"
          name="age"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
        />
        {errors.age && <span data-testid="error-age">{errors.age[0]}</span>}
      </div>

      <div>
        <label htmlFor="agreeToTerms">Agree to Terms</label>
        <input
          id="agreeToTerms"
          type="checkbox"
          checked={formData.agreeToTerms === 'on'}
          onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked ? 'on' : 'off' })}
        />
      </div>

      <button type="submit">Register</button>
      {isSuccess && <div data-testid="success-message">Registration Successful!</div>}
    </form>
  );
}

describe('Integration Testing: React Form Validation (Vitest + React Testing Library)', () => {
  it('renders form and displays field error messages on invalid submit', () => {
    const handleSuccess = vi.fn();
    render(<RegistrationForm onSubmitSuccess={handleSuccess} />);

    // Click submit with empty form values
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    expect(screen.getByTestId('error-username')).toHaveTextContent('Username must be at least 3 characters');
    expect(screen.getByTestId('error-email')).toHaveTextContent('Please enter a valid email address');
    expect(handleSuccess).not.toHaveBeenCalled();
  });

  it('validates form, coerces string numbers/booleans, and triggers success callback on valid submit', () => {
    const handleSuccess = vi.fn();
    render(<RegistrationForm onSubmitSuccess={handleSuccess} />);

    // Fill valid inputs
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'john_doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Age/i), { target: { value: '25' } });
    fireEvent.click(screen.getByLabelText(/Agree to Terms/i));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    expect(screen.queryByTestId('error-username')).toBeNull();
    expect(screen.queryByTestId('error-email')).toBeNull();
    expect(screen.queryByTestId('error-age')).toBeNull();
    expect(screen.getByTestId('success-message')).toHaveTextContent('Registration Successful!');

    expect(handleSuccess).toHaveBeenCalledWith({
      username: 'john_doe',
      email: 'john@example.com',
      age: 25,
      agreeToTerms: true,
    });
  });
});
