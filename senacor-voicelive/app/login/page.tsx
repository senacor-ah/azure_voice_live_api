'use client'

import { login } from '@/app/actions/auth'
import { useActionState } from 'react'
import { useState } from 'react'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg">
          {/* Sign In */}
          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              {/* Senacor Bank Logo */}
              <div className="flex justify-center mb-6">
                <svg
                  width="200"
                  height="60"
                  viewBox="0 0 200 60"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-slate-800"
                >
                  {/* S Symbol */}
                  <circle cx="30" cy="30" r="24" fill="#1e40af" />
                  <text
                    x="30"
                    y="42"
                    fontSize="32"
                    fontWeight="bold"
                    fill="white"
                    textAnchor="middle"
                  >
                    S
                  </text>
                  {/* Text */}
                  <text
                    x="65"
                    y="36"
                    fontSize="24"
                    fontWeight="bold"
                    fill="#1e293b"
                  >
                    SENACOR
                  </text>
                  <text
                    x="65"
                    y="50"
                    fontSize="14"
                    fontWeight="normal"
                    fill="#64748b"
                  >
                    BANK
                  </text>
                </svg>
              </div>
              
              <h3 className="block text-2xl font-bold text-slate-900">
                Anmelden
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Willkommen zurück zur Senacor Bank
              </p>
            </div>

            <div className="mt-5">
              {/* Form */}
              <form action={action}>
                <div className="grid gap-y-4">
                  {/* Global Error Message */}
                  {state?.message && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
                      {state.message}
                    </div>
                  )}

                  {/* Name Group */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-2 text-slate-900"
                    >
                      Ihr Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className={`py-2.5 sm:py-3 px-4 block w-full bg-white border rounded-lg sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none ${
                          state?.errors?.name
                            ? 'border-red-500'
                            : 'border-slate-300'
                        }`}
                        required
                        aria-describedby="name-error"
                        placeholder="Max Mustermann"
                      />
                      {state?.errors?.name && (
                        <div className="absolute inset-y-0 end-0 flex items-center pointer-events-none pe-3">
                          <svg
                            className="size-5 text-red-500"
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                            aria-hidden="true"
                          >
                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {state?.errors?.name && (
                      <p className="text-xs text-red-600 mt-2" id="name-error">
                        {state.errors.name}
                      </p>
                    )}
                  </div>
                  {/* End Name Group */}

                  {/* Email Group */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-2 text-slate-900"
                    >
                      E-Mail-Adresse
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className={`py-2.5 sm:py-3 px-4 block w-full bg-white border rounded-lg sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none ${
                          state?.errors?.email
                            ? 'border-red-500'
                            : 'border-slate-300'
                        }`}
                        required
                        aria-describedby="email-error"
                        placeholder="ihre.email@example.com"
                      />
                      {state?.errors?.email && (
                        <div className="absolute inset-y-0 end-0 flex items-center pointer-events-none pe-3">
                          <svg
                            className="size-5 text-red-500"
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                            aria-hidden="true"
                          >
                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {state?.errors?.email && (
                      <p className="text-xs text-red-600 mt-2" id="email-error">
                        {state.errors.email}
                      </p>
                    )}
                  </div>
                  {/* End Email Group */}

                  {/* Password Group */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium mb-2 text-slate-900"
                      >
                        Passwort
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        className={`py-2.5 sm:py-3 px-4 block w-full bg-white border rounded-lg sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none ${
                          state?.errors?.password
                            ? 'border-red-500'
                            : 'border-slate-300'
                        }`}
                        required
                        aria-describedby="password-error"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <svg
                            className="size-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="size-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {state?.errors?.password && (
                      <p
                        className="text-xs text-red-600 mt-2"
                        id="password-error"
                      >
                        {state.errors.password}
                      </p>
                    )}
                  </div>
                  {/* End Password Group */}

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center">
                    <div className="flex">
                      <input
                        id="remember"
                        name="remember"
                        type="checkbox"
                        className="shrink-0 size-4 bg-transparent border-slate-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600 disabled:opacity-50 disabled:pointer-events-none"
                      />
                    </div>
                    <div className="ms-3">
                      <label htmlFor="remember" className="text-sm text-slate-900">
                        Angemeldet bleiben
                      </label>
                    </div>
                  </div>
                  {/* End Checkbox */}

                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg bg-blue-600 border border-blue-700 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {pending ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Anmelden...
                      </>
                    ) : (
                      'Anmelden'
                    )}
                  </button>
                </div>
              </form>
              {/* End Form */}
            </div>
          </div>
          {/* End Sign In */}
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          © 2026 Senacor Bank. Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  )
}
