import { useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthForm({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const [fields, setFields] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setFields((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    setIsSubmitting(true);
    try {
      if (isRegister) await register(fields);
      else await login({ email: fields.email, password: fields.password });
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length) {
        setFieldErrors(error.fieldErrors);
      } else {
        setFormError(error.message || "We couldn't complete that request.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldsToRender = [
    ...(isRegister ? [{ name: "name", label: "Name", type: "text" }] : []),
    { name: "email", label: "Email", type: "email" },
    { name: "password", label: "Password", type: "password" },
  ];

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-7 text-center">
          <Link
            to="/"
            className="font-display text-[28px] font-semibold tracking-[-0.05em] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            SkillMap
          </Link>
        </div>
        <section className="rounded-card border border-line bg-surface p-6 sm:p-8">
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-secondary">
            {isRegister
              ? "Sign up to explore your career options."
              : "Sign in to continue your career research."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {fieldsToRender.map(({ name, label, type }) => (
              <div key={name}>
                <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink">
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type={type}
                  autoComplete={
                    name === "name"
                      ? "name"
                      : name === "email"
                        ? "email"
                        : isRegister
                          ? "new-password"
                          : "current-password"
                  }
                  value={fields[name]}
                  onChange={updateField}
                  required={name !== "name"}
                  minLength={name === "password" && isRegister ? 8 : undefined}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors[name])}
                  aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
                  className="h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-focus disabled:bg-canvas"
                />
                {fieldErrors[name] && (
                  <p id={`${name}-error`} className="mt-1.5 text-xs text-danger">
                    {fieldErrors[name]}
                  </p>
                )}
              </div>
            ))}

            {formError && (
              <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !fields.email.trim() || !fields.password}
              className="flex h-10 w-full items-center justify-center rounded-control bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-disabled"
            >
              {isSubmitting
                ? isRegister ? "Creating account..." : "Signing in..."
                : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-secondary">
            {isRegister ? "Already have an account?" : "New to SkillMap?"} {" "}
            <Link
              to={isRegister ? "/login" : "/register"}
              className="font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
