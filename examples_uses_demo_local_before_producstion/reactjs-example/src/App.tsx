import React, { useState } from 'react';

function App() {
  const [form, setForm] = useState({ name: '', email: '', age: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:4000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, errors: ['Network error'] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Testing gigli.js library (Fullstack)</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Email:</label>
          <input name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <label>Age:</label>
          <input name="age" value={form.age} onChange={handleChange} required type="number" min={0} />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      {result && (
        <div style={{ marginTop: 20 }}>
          {result.success ? (
            <div style={{ color: 'green' }}>Success! Data: <pre>{JSON.stringify(result.data, null, 2)}</pre></div>
          ) : (
            <div style={{ color: 'red' }}>Errors: <ul>{result.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul></div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
