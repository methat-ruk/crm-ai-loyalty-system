'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import axios from 'axios'
import { customerService } from '@/services/customerService'
import type { Customer, CreateCustomerPayload, UpdateCustomerPayload } from '@/types'

type CustomerInput = Pick<Customer, 'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'dateOfBirth'>

interface CustomerFormProps {
  customer?: CustomerInput
  onClose: () => void
  onSuccess: () => void
}

type FieldErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'phone' | 'dateOfBirth', string>>

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({
  label,
  error,
  required,
  hint,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-slate-600">
      {label}{required && ' *'}
    </label>
    {children}
    {error ? (
      <p className="text-xs text-red-500">{error}</p>
    ) : hint ? (
      <p className="text-xs text-slate-400">{hint}</p>
    ) : null}
  </div>
)

// ─── Form ─────────────────────────────────────────────────────────────────────

export const CustomerForm = ({ customer, onClose, onSuccess }: CustomerFormProps) => {
  const isEdit = !!customer

  const [form, setForm] = useState({
    firstName: customer?.firstName ?? '',
    lastName: customer?.lastName ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone?.replace(/-/g, '') ?? '',
    dateOfBirth: customer?.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '',
  })
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState('')

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {}
    if (!form.firstName.trim()) errs.firstName = 'Required'
    if (!form.lastName.trim()) errs.lastName = 'Required'
    if (!form.email.trim()) {
      errs.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Invalid email format'
    }
    if (form.phone && !/^0[6-9]\d{8}$|^0[2-5]\d{7,8}$/.test(form.phone)) {
      errs.phone = 'Invalid Thai phone number (e.g. 081-234-5678)'
    }
    return errs
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setGeneralError('')
    setLoading(true)

    try {
      const [clientErrs, emailCheck] = await Promise.all([
        Promise.resolve(validate()),
        form.email
          ? customerService.checkEmail(form.email, isEdit ? customer.id : undefined)
          : Promise.resolve({ available: true }),
      ])

      const allErrors: FieldErrors = { ...clientErrs }
      if (!emailCheck.available) allErrors.email = 'This email is already in use'

      if (Object.keys(allErrors).length > 0) {
        setFieldErrors(allErrors)
        return
      }

      setFieldErrors({})
      const payload = {
        ...form,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      }
      if (isEdit) {
        await customerService.update(customer.id, payload as UpdateCustomerPayload)
      } else {
        await customerService.create(payload as CreateCustomerPayload)
      }
      onSuccess()
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data
        const msg = data?.message ?? err.message
        setGeneralError(Array.isArray(msg) ? msg.join(', ') : msg)
      } else {
        setGeneralError('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: keyof FieldErrors) =>
    clsx(fieldErrors[field] && 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-200')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {isEdit ? 'Edit Customer' : 'Add Customer'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required error={fieldErrors.firstName}>
              <Input value={form.firstName} onChange={set('firstName')} className={inputClass('firstName')} />
            </Field>
            <Field label="Last Name" required error={fieldErrors.lastName}>
              <Input value={form.lastName} onChange={set('lastName')} className={inputClass('lastName')} />
            </Field>
          </div>

          <Field label="Email" required error={fieldErrors.email}>
            <Input type="email" value={form.email} onChange={set('email')} className={inputClass('email')} />
          </Field>

          <Field label="Phone" error={fieldErrors.phone} hint="มือถือ 08x/09x หรือบ้าน 02x-05x">
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                setForm((prev) => ({ ...prev, phone: digits }))
                setFieldErrors((prev) => ({ ...prev, phone: undefined }))
              }}
              placeholder="0xx-xxx-xxxx"
              maxLength={10}
              className={inputClass('phone')}
            />
          </Field>

          <Field label="Date of Birth" error={fieldErrors.dateOfBirth}>
            <Input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inputClass('dateOfBirth')} />
          </Field>

          {generalError && <p className="text-xs text-red-500">{generalError}</p>}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-500 bg-slate-200 hover:bg-slate-300 cursor-pointer">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
