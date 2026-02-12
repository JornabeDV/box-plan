'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps {
  id?: string
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (value: boolean) => void
  className?: string
  disabled?: boolean
  name?: string
  required?: boolean
}

function Switch({ 
  id, 
  checked, 
  defaultChecked = false,
  onCheckedChange, 
  className,
  disabled = false,
  name,
  required
}: SwitchProps) {
  const [isOn, setIsOn] = useState(checked !== undefined ? checked : defaultChecked)
  const [isFocused, setIsFocused] = useState(false)

  // Mantener sincronizado si checked cambia desde afuera (controlled mode)
  useEffect(() => {
    if (checked !== undefined) {
      setIsOn(checked)
    }
  }, [checked])

  const toggle = useCallback(() => {
    if (disabled) return
    
    const newValue = !isOn
    if (checked === undefined) {
      // Uncontrolled mode
      setIsOn(newValue)
    }
    onCheckedChange?.(newValue)
  }, [isOn, checked, disabled, onCheckedChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }, [toggle])

  const isControlled = checked !== undefined
  const inputId = id || `switch-${Math.random().toString(36).slice(2, 11)}`
  const isChecked = isControlled ? checked : isOn

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      {/* Input oculto para accesibilidad y formularios */}
      <input
        type="checkbox"
        id={inputId}
        name={name}
        checked={isChecked}
        onChange={(e) => {
          if (!isControlled) {
            setIsOn(e.target.checked)
          }
          onCheckedChange?.(e.target.checked)
        }}
        disabled={disabled}
        required={required}
        className="sr-only"
        aria-checked={isChecked}
        role="switch"
      />
      
      {/* Track del switch */}
      <div
        onClick={toggle}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'w-11 h-6 rounded-full cursor-pointer transition-all duration-200 ease-in-out flex items-center outline-none',
          // Estados de color
          isChecked 
            ? 'bg-lime-400' 
            : 'bg-gray-400 dark:bg-gray-600 border border-gray-500 dark:border-gray-500',
          // Estados de foco
          isFocused && 'ring-2 ring-lime-400/50 ring-offset-2 ring-offset-background',
          // Estado deshabilitado
          disabled && 'opacity-50 cursor-not-allowed',
          // Hover
          !disabled && !isChecked && 'hover:bg-muted/80'
        )}
      >
        {/* Thumb (círculo) */}
        <div
          className={cn(
            'w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out',
            isChecked ? 'translate-x-5' : 'translate-x-0.5',
            // Color del thumb
            isChecked ? 'bg-black' : 'bg-background',
            // Sombra más pronunciada cuando está activo
            isChecked && 'shadow-lg'
          )}
        />
      </div>
    </div>
  )
}

export { Switch }
