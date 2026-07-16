'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type TimerMode = 'normal' | 'tabata' | 'fortime' | 'amrap' | 'emom' | 'otm'

interface UseTimerProps {
	mode: TimerMode
	workTime: string
	restTime: string
	totalRounds: string
	amrapTime: string
	forTimeCap?: string
}

// AudioContext compartido para todo el timer. Se crea una sola vez y se reanuda
// dentro del flujo de interacción del usuario (click en "Iniciar") para cumplir
// con las políticas de autoplay de los navegadores.
let sharedAudioContext: AudioContext | null = null

const getAudioContext = (): AudioContext | null => {
	if (typeof window === 'undefined') return null
	if (!sharedAudioContext) {
		const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
		if (!AudioContextClass) return null
		sharedAudioContext = new AudioContextClass()
	}
	return sharedAudioContext
}

const ensureAudioContext = async (): Promise<AudioContext | null> => {
	const ctx = getAudioContext()
	if (!ctx) return null
	if (ctx.state === 'suspended') {
		try {
			await ctx.resume()
		} catch (e) {
			// Si no se puede reanudar, seguimos intentando reproducir de todos modos.
		}
	}
	return ctx
}

// Detectar iOS/iPadOS para aplicar ajustes específicos de audio
const isIOS = (): boolean => {
	if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
	const ua = navigator.userAgent
	const isAppleDevice = /iPad|iPhone|iPod/.test(ua)
	const isIPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
	return isAppleDevice || isIPadOS
}

// Compresor compartido para maximizar el volumen percibido sin clipping
let sharedCompressor: DynamicsCompressorNode | null = null

const getCompressor = (ctx: AudioContext): DynamicsCompressorNode => {
	if (!sharedCompressor) {
		sharedCompressor = ctx.createDynamicsCompressor()
		// Configuración optimizada para sonidos cortos y volumen máximo percibido
		sharedCompressor.threshold.setValueAtTime(-6, ctx.currentTime)
		sharedCompressor.knee.setValueAtTime(6, ctx.currentTime)
		sharedCompressor.ratio.setValueAtTime(6, ctx.currentTime)
		sharedCompressor.attack.setValueAtTime(0.001, ctx.currentTime)
		sharedCompressor.release.setValueAtTime(0.05, ctx.currentTime)
		sharedCompressor.connect(ctx.destination)
	}
	return sharedCompressor
}

// SONIDO TIPO CAMPANA DE GIMNASIO (estándar CrossFit)
// Usa múltiples armónicos para simular una campana metálica
const playBellSound = (isHigh: boolean = false) => {
	try {
		const ctx = getAudioContext()
		if (!ctx) return

		const iOS = isIOS()
		// Frecuencias base más agudas en iOS para que el parlante pequeño las reproduzca mejor
		const baseFreq = isHigh ? (iOS ? 1760 : 880) : (iOS ? 1047 : 523)
		// Más armónicos en iOS para darle más energía y corte al sonido
		const freqMultipliers = iOS ? [1, 2, 3, 4] : [1, 1.5, 2]
		const duration = isHigh ? (iOS ? 0.9 : 0.6) : (iOS ? 0.25 : 0.15)
		const masterVolume = 1.0

		const freqs = freqMultipliers.map(m => baseFreq * m)
		const now = ctx.currentTime

		freqs.forEach((freq, i) => {
			const oscillator = ctx.createOscillator()
			const gainNode = ctx.createGain()

			oscillator.connect(gainNode)
			gainNode.connect(getCompressor(ctx))

			oscillator.frequency.value = freq
			oscillator.type = 'triangle' // Más similar a campana que sine

			// Envolvente tipo campana (attack rápido, decay largo)
			const volume = masterVolume / (i + 1)
			const attack = iOS ? 0.005 : 0.02
			gainNode.gain.setValueAtTime(0, now)
			gainNode.gain.linearRampToValueAtTime(volume, now + attack)
			gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)

			oscillator.start(now)
			oscillator.stop(now + duration)
		})
	} catch (e) {}
}

// Sonido de conteo (3-2-1) - Campana corta y grave
const playCountdownBeep = () => {
	playBellSound(false)
}

// Sonido de inicio - Campana larga y aguda
const playStartBeep = () => {
	playBellSound(true)
}

// Sonido simple tipo "clock beep" para cuenta regresiva larga
const playSimpleBeep = () => {
	try {
		const ctx = getAudioContext()
		if (!ctx) return

		const iOS = isIOS()
		const oscillator = ctx.createOscillator()
		const gainNode = ctx.createGain()

		oscillator.connect(gainNode)
		gainNode.connect(getCompressor(ctx))

		// Frecuencia más alta en iOS para mejorar audibilidad en su parlante pequeño
		oscillator.frequency.value = iOS ? 1200 : 600
		oscillator.type = 'sine'

		const now = ctx.currentTime
		const duration = iOS ? 0.12 : 0.08
		const volume = 1.0

		gainNode.gain.setValueAtTime(0, now)
		gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
		gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)

		oscillator.start(now)
		oscillator.stop(now + duration)
	} catch (e) {}
}

// Sonido de finalización - doble campana aguda
const playFinishBeep = () => {
	try {
		const ctx = getAudioContext()
		if (!ctx) return

		const iOS = isIOS()
		const baseFreqs = iOS ? [1760, 2350] : [880, 1175] // La6 + Re#7 en iOS
		const duration = iOS ? 0.7 : 0.5

		const now = ctx.currentTime

		baseFreqs.forEach((freq, i) => {
			const oscillator = ctx.createOscillator()
			const gainNode = ctx.createGain()

			oscillator.connect(gainNode)
			gainNode.connect(getCompressor(ctx))

			oscillator.frequency.value = freq
			oscillator.type = 'triangle'

			const startOffset = i * 0.12
			const volume = iOS ? 1.0 : 1.0

			gainNode.gain.setValueAtTime(0, now + startOffset)
			gainNode.gain.linearRampToValueAtTime(volume / (i + 1), now + startOffset + 0.02)
			gainNode.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration)

			oscillator.start(now + startOffset)
			oscillator.stop(now + startOffset + duration)
		})
	} catch (e) {}
}

// Warm-up del audio dentro del flujo de interacción del usuario.
// En iOS/Safari es fundamental reproducir un sonido (aunque sea inaudible)
// dentro del handler táctil para despertar la sesión de audio antes de los beeps.
const warmUpAudio = async () => {
	try {
		const ctx = await ensureAudioContext()
		if (!ctx) return

		const oscillator = ctx.createOscillator()
		const gainNode = ctx.createGain()

		oscillator.connect(gainNode)
		gainNode.connect(getCompressor(ctx))

		oscillator.frequency.value = 1000
		oscillator.type = 'sine'

		const now = ctx.currentTime
		gainNode.gain.setValueAtTime(0.001, now)
		gainNode.gain.linearRampToValueAtTime(0.001, now + 0.005)
		gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.01)

		oscillator.start(now)
		oscillator.stop(now + 0.01)
	} catch (e) {}
}

export function useTimer({
	mode,
	workTime,
	restTime,
	totalRounds,
	amrapTime,
	forTimeCap,
}: UseTimerProps) {
	const [time, setTime] = useState(0)
	const [isRunning, setIsRunning] = useState(false)
	const [isPaused, setIsPaused] = useState(false)
	const [currentRound, setCurrentRound] = useState(1)
	const [amrapInitialTime, setAmrapInitialTime] = useState(600)
	const [isWorkPhase, setIsWorkPhase] = useState(true)
	const [countdown, setCountdown] = useState<number | null>(null)
	const [soundEnabled, setSoundEnabled] = useState(true)

	const intervalRef = useRef<NodeJS.Timeout | null>(null)
	const lastCountdownRef = useRef<number | null>(null)
	const prevIsWorkPhaseRef = useRef(isWorkPhase)
	const prevIsRunningRef = useRef(isRunning)
	const prevTimeRef = useRef(time)

	// Efecto para reproducir sonidos durante la cuenta regresiva
	useEffect(() => {
		if (!soundEnabled) return
		if (countdown !== null && countdown > 0 && countdown !== lastCountdownRef.current) {
			// Sonido de campana para 3, 2, 1
			if (countdown <= 3 && countdown > 0) {
				playCountdownBeep()
			} else {
				// Beep simple para el resto de la cuenta (10-4)
				playSimpleBeep()
			}
			lastCountdownRef.current = countdown
		}
		// La campana de inicio ahora se reproduce inmediatamente al presionar "Iniciar"
		// dentro del flujo de interacción del usuario, evitando que iOS/Safari la silencie.
		if (lastCountdownRef.current !== null && countdown === null) {
			lastCountdownRef.current = null
		}
	}, [countdown, soundEnabled])

	// Efecto para sonidos en EMOM y OTM (últimos 3 segundos de cada intervalo)
	useEffect(() => {
		if (!soundEnabled || !isRunning || isPaused || countdown) return
		if (mode === 'emom') {
			const secondsIntoMinute = time % 60
			// Últimos 3 segundos del minuto - campana de conteo
			if (secondsIntoMinute >= 57 && secondsIntoMinute < 60) {
				playCountdownBeep()
			}
		}
		if (mode === 'otm') {
			const otmIntervalNum = Math.max(60, (parseInt(workTime || '1') || 1) * 60)
			const secondsIntoInterval = time % otmIntervalNum
			// Últimos 3 segundos del intervalo - campana de conteo
			if (secondsIntoInterval >= otmIntervalNum - 3 && secondsIntoInterval < otmIntervalNum) {
				playCountdownBeep()
			}
		}
	}, [time, mode, isRunning, isPaused, countdown, soundEnabled, workTime])

	// Efecto para sonidos en cambios de fase (Tabata y AMRAP multipronda)
	useEffect(() => {
		if (!soundEnabled || !isRunning || isPaused || countdown) return
		if (mode === 'tabata' || (mode === 'amrap' && Math.max(1, parseInt(totalRounds || '1')) > 1)) {
			// Solo sonar cuando realmente cambia la fase, no en el render inicial
			if (isWorkPhase !== prevIsWorkPhaseRef.current && prevIsRunningRef.current) {
				playStartBeep()
			}
		}
		prevIsWorkPhaseRef.current = isWorkPhase
	}, [isWorkPhase, mode, isRunning, isPaused, countdown, soundEnabled, totalRounds])

	// Efecto para sonido de finalización cuando el timer se detiene por tiempo agotado
	useEffect(() => {
		if (!soundEnabled) return
		// Si estaba corriendo y ahora no, y el tiempo llegó a 0 (no fue un reset/pausa manual)
		if (prevIsRunningRef.current && !isRunning && time === 0) {
			playFinishBeep()
		}
		prevIsRunningRef.current = isRunning
		prevTimeRef.current = time
	}, [isRunning, time, soundEnabled])

	// Inicializar tiempo de AMRAP cuando cambia el modo o el tiempo configurado
	useEffect(() => {
		if (mode === 'amrap' && !isRunning && !isPaused) {
			const amrapTimeNum = Math.max(1, parseInt(amrapTime) || 10)
			const amrapTimeInSeconds = amrapTimeNum * 60
			if (time === 0 || time === amrapInitialTime || time === parseInt(restTime || '60')) {
				setTime(amrapTimeInSeconds)
				setAmrapInitialTime(amrapTimeInSeconds)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, amrapTime, restTime])

	useEffect(() => {
		if (isRunning && !isPaused) {
			intervalRef.current = setInterval(() => {
				// Manejar cuenta regresiva para todos los modos
				if ((mode === 'normal' || mode === 'tabata' || mode === 'fortime' || mode === 'amrap' || mode === 'emom' || mode === 'otm') && countdown !== null && countdown > 0) {
					setCountdown(prev => {
						if (prev === null) return null
						const newCountdown = prev - 1
						if (newCountdown <= 0) {
							setCountdown(null)
							// Para AMRAP, establecer el tiempo inicial cuando termina la cuenta regresiva
							if (mode === 'amrap') {
								const amrapTimeNum = Math.max(1, parseInt(amrapTime) || 10)
								const amrapTimeInSeconds = amrapTimeNum * 60
								setTime(amrapTimeInSeconds)
								setAmrapInitialTime(amrapTimeInSeconds)
								setIsWorkPhase(true)
								setCurrentRound(1)
							} else if (mode === 'emom') {
								// Para EMOM, iniciar en el segundo 0 del primer minuto
								setTime(0)
								setCurrentRound(1)
							} else if (mode === 'otm') {
								// Para OTM, iniciar en el segundo 0 del primer intervalo
								setTime(0)
								setCurrentRound(1)
							} else {
								setTime(0)
							}
						}
						return newCountdown
					})
					return
				}

				setTime(prevTime => {
					// Solo procesar tiempo si no hay cuenta regresiva activa
					if (countdown !== null && countdown > 0) {
						return prevTime
					}

					if (mode === 'amrap') {
						const amrapTimeNum = Math.max(1, parseInt(amrapTime) || 10)
						const restTimeNum = Math.max(0, parseInt(restTime) || 60)
						const totalRoundsNum = Math.max(1, parseInt(totalRounds) || 1)

						// Si es una sola ronda, comportamiento clásico de AMRAP
						if (totalRoundsNum <= 1) {
							const newTime = prevTime - 1
							if (newTime <= 0) {
								setIsRunning(false)
								return 0
							}
							return newTime
						}

						// Múltiples rondas: alternar entre trabajo y descanso
						if (isWorkPhase) {
							// Fase de trabajo (AMRAP)
							const newTime = prevTime - 1
							if (newTime <= 0) {
								// Terminó esta ronda de AMRAP
								if (currentRound >= totalRoundsNum) {
									// Terminó todo el entrenamiento
									setIsRunning(false)
									return 0
								} else {
									// Pasar a descanso
									setIsWorkPhase(false)
									return restTimeNum
								}
							}
							return newTime
						} else {
							// Fase de descanso
							const newTime = prevTime - 1
							if (newTime <= 0) {
								// Terminó el descanso, pasar a siguiente ronda
								setIsWorkPhase(true)
								setCurrentRound(prev => prev + 1)
								return amrapTimeNum * 60
							}
							return newTime
						}
					}

					const newTime = prevTime + 1

					// Lógica FOR TIME: detener si se alcanza el time cap
					if (mode === 'fortime') {
						const forTimeCapNum = Math.max(0, parseInt(forTimeCap || '0') || 0)
						if (forTimeCapNum > 0 && newTime >= forTimeCapNum * 60) {
							setIsRunning(false)
							return forTimeCapNum * 60
						}
					}

					if (mode === 'tabata') {
						const workTimeNum = Math.max(1, parseInt(workTime) || 20)
						const restTimeNum = Math.max(0, parseInt(restTime) || 10)
						const totalWorkRest = workTimeNum + restTimeNum
						const cycleTime = newTime % totalWorkRest

						// Determinar si estamos en fase de trabajo o descanso
						// cycleTime 0 a workTimeNum-1: trabajo
						// cycleTime workTimeNum a totalWorkRest-1: descanso
						const shouldBeWorkPhase = cycleTime < workTimeNum

						// Actualizar fase si cambió
						if (shouldBeWorkPhase !== isWorkPhase) {
							setIsWorkPhase(shouldBeWorkPhase)

							// Incrementar ronda cuando empezamos una nueva fase de trabajo
							if (shouldBeWorkPhase) {
								setCurrentRound(prev => {
									const newRound = prev + 1
									const totalRoundsNum = Math.max(1, parseInt(totalRounds) || 8)
									if (newRound > totalRoundsNum) {
										setIsRunning(false)
										return prev
									}
									return newRound
								})
							}
						}
					}

					// Lógica EMOM: incrementar ronda cada 60 segundos
					if (mode === 'emom') {
						const totalRoundsNum = Math.max(1, parseInt(totalRounds) || 10)
						const currentEmomRound = Math.floor(newTime / 60) + 1

						if (currentEmomRound > totalRoundsNum) {
							setIsRunning(false)
							return prevTime
						}

						if (currentEmomRound !== currentRound) {
							setCurrentRound(currentEmomRound)
						}
					}

					// Lógica OTM: incrementar ronda cada X minutos (configurable)
					if (mode === 'otm') {
						const totalRoundsNum = Math.max(1, parseInt(totalRounds) || 10)
						const otmIntervalNum = Math.max(60, (parseInt(workTime || '1') || 1) * 60) // Convertir minutos a segundos
						const currentOtmRound = Math.floor(newTime / otmIntervalNum) + 1

						if (currentOtmRound > totalRoundsNum) {
							setIsRunning(false)
							return prevTime
						}

						if (currentOtmRound !== currentRound) {
							setCurrentRound(currentOtmRound)
						}
					}

					return newTime
				})
			}, 1000)
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [isRunning, isPaused, mode, workTime, restTime, totalRounds, isWorkPhase, countdown, currentRound, amrapTime, forTimeCap])

	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600)
		const minutes = Math.floor((seconds % 3600) / 60)
		const secs = seconds % 60

		if (hours > 0) {
			return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
		}
		return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

	const getCurrentPhaseTime = () => {
		if (mode === 'tabata') {
			const workTimeNum = Math.max(1, parseInt(workTime) || 20)
			const restTimeNum = Math.max(0, parseInt(restTime) || 10)
			const totalWorkRest = workTimeNum + restTimeNum
			const cycleTime = time % totalWorkRest

			if (isWorkPhase) {
				// Tiempo restante en fase de trabajo
				// cycleTime va de 0 a workTimeNum-1 durante el trabajo
				if (cycleTime === 0) {
					// Inicio de un nuevo ciclo completo o inicio del timer
					return workTimeNum
				}
				return workTimeNum - cycleTime
			} else {
				// Tiempo restante en fase de descanso
				// cycleTime va de workTimeNum a totalWorkRest-1 durante el descanso
				return totalWorkRest - cycleTime
			}
		}
		return time
	}

	const getEmomCountdown = () => {
		// EMOM: cuenta regresiva desde 60 segundos cada minuto
		const secondsIntoMinute = time % 60
		return 60 - secondsIntoMinute
	}

	const getOtmCountdown = () => {
		// OTM: cuenta regresiva desde el intervalo configurable (en minutos)
		const otmIntervalNum = Math.max(60, (parseInt(workTime || '1') || 1) * 60) // Convertir minutos a segundos
		const secondsIntoInterval = time % otmIntervalNum
		return otmIntervalNum - secondsIntoInterval
	}

	const getDisplayTime = () => {
		// Mostrar cuenta regresiva si está activa en cualquier modo
		if ((mode === 'normal' || mode === 'tabata' || mode === 'fortime' || mode === 'amrap' || mode === 'emom' || mode === 'otm') && countdown !== null && countdown > 0) {
			return formatTime(countdown)
		}
		if (mode === 'tabata') {
			return formatTime(getCurrentPhaseTime())
		}
		if (mode === 'amrap') {
			return formatTime(Math.max(0, time))
		}
		if (mode === 'emom') {
			return formatTime(getEmomCountdown())
		}
		if (mode === 'otm') {
			return formatTime(getOtmCountdown())
		}
		return formatTime(time)
	}

	const getEmomTotalTime = () => {
		// En EMOM, el tiempo total es simplemente el tiempo transcurrido
		return formatTime(time)
	}

	const getOtmTotalTime = () => {
		// En OTM, el tiempo total es simplemente el tiempo transcurrido
		return formatTime(time)
	}

	const getPhaseText = () => {
		if ((mode === 'normal' || mode === 'tabata' || mode === 'fortime' || mode === 'amrap' || mode === 'emom' || mode === 'otm') && countdown !== null && countdown > 0) {
			return 'PREPARATE'
		}
		if (mode === 'tabata') {
			return isWorkPhase ? 'TRABAJO' : 'DESCANSO'
		}
		if (mode === 'amrap') {
			const totalRoundsNum = Math.max(1, parseInt(totalRounds) || 1)
			// Solo mostrar fase si hay múltiples rondas
			if (totalRoundsNum > 1) {
				return isWorkPhase ? 'TRABAJO' : 'DESCANSO'
			}
		}
		return 'TIEMPO'
	}

	const getPhaseColor = () => {
		if (mode === 'tabata') {
			return isWorkPhase ? 'text-primary' : 'text-green-500'
		}
		if (mode === 'amrap') {
			const totalRoundsNum = Math.max(1, parseInt(totalRounds) || 1)
			// Solo cambiar color si hay múltiples rondas
			if (totalRoundsNum > 1) {
				return isWorkPhase ? 'text-primary' : 'text-green-500'
			}
		}
		return 'text-primary'
	}

	const handleStart = useCallback(async () => {
		// Asegurar que el AudioContext esté activo dentro del flujo de interacción del usuario
		// y reproducir un sonido de warm-up para despertar la sesión de audio en iOS/Safari.
		if (soundEnabled) {
			await ensureAudioContext()
			await warmUpAudio()
			// En iOS el primer sonido fuera del gesto táctil puede salir muy bajo o silenciado,
			// por eso reproducimos la campana de inicio inmediatamente al presionar el botón.
			if (!isRunning && !isPaused) {
				playStartBeep()
			}
		}

		// Iniciar cuenta regresiva de 10 segundos cuando se larga desde cero
		if (!isRunning && !isPaused && countdown === null) {
			// En AMRAP, si terminó previamente, restaurar el tiempo antes de la cuenta regresiva
			if (mode === 'amrap' && time === 0 && amrapInitialTime > 0 && amrapInitialTime !== 600) {
				setTime(amrapInitialTime)
			}
			setCountdown(10)
		}
		setIsRunning(true)
		setIsPaused(false)
	}, [soundEnabled, mode, isRunning, isPaused, time, countdown, amrapInitialTime])

	const handlePause = () => {
		setIsPaused(!isPaused)
	}

	const handleReset = (resetToZero = false) => {
		if (mode === 'amrap' && !resetToZero) {
			const amrapTimeNum = Math.max(1, parseInt(amrapTime) || 10)
			const amrapTimeInSeconds = amrapTimeNum * 60
			setTime(amrapTimeInSeconds)
			setAmrapInitialTime(amrapTimeInSeconds)
		} else {
			setTime(0)
		}
		setCountdown(null)
		setIsRunning(false)
		setIsPaused(false)
		setCurrentRound(1)
		setIsWorkPhase(true)
		lastCountdownRef.current = null
	}

	const toggleSound = useCallback(async () => {
		const next = !soundEnabled
		setSoundEnabled(next)
		if (next) {
			// Si se activa el sonido dentro de una interacción, reanudar el contexto
			// y calentar la sesión de audio para iOS/Safari.
			await ensureAudioContext()
			await warmUpAudio()
		}
	}, [soundEnabled])

	return {
		time,
		isRunning,
		isPaused,
		currentRound,
		isWorkPhase,
		countdown,
		soundEnabled,
		getDisplayTime,
		getPhaseText,
		getPhaseColor,
		getEmomTotalTime,
		getOtmTotalTime,
		handleStart,
		handlePause,
		handleReset,
		toggleSound,
	}
}

export type { TimerMode }
