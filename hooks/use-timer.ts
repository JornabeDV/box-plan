'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type TimerMode = 'normal' | 'tabata' | 'fortime' | 'amrap' | 'emom' | 'otm'

interface UseTimerProps {
	mode: TimerMode
	workTime: string
	restTime: string
	totalRounds: string
	amrapTime: string
}

// SONIDO TIPO CAMPANA DE GIMNASIO (estándar CrossFit)
// Usa múltiples armónicos para simular una campana metálica
const playBellSound = (isHigh: boolean = false) => {
	try {
		const AudioContext = window.AudioContext || (window as any).webkitAudioContext
		if (!AudioContext) return

		const audioContext = new AudioContext()
		
		// Frecuencias base: campana grave para conteo, aguda para inicio
		const baseFreq = isHigh ? 880 : 523 // La5 (agudo) o Do5 (grave)
		const freqs = [baseFreq, baseFreq * 1.5, baseFreq * 2] // Fundamental + 5ta + octava
		const duration = isHigh ? 0.6 : 0.15 // Más largo para inicio
		
		freqs.forEach((freq, i) => {
			const oscillator = audioContext.createOscillator()
			const gainNode = audioContext.createGain()
			
			oscillator.connect(gainNode)
			gainNode.connect(audioContext.destination)
			
			oscillator.frequency.value = freq
			oscillator.type = 'triangle' // Más similar a campana que sine
			
			// Envolvente tipo campana (attack rápido, decay largo)
			const volume = isHigh ? 0.2 : 0.15
			gainNode.gain.setValueAtTime(0, audioContext.currentTime)
			gainNode.gain.linearRampToValueAtTime(volume / (i + 1), audioContext.currentTime + 0.02)
			gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
			
			oscillator.start(audioContext.currentTime)
			oscillator.stop(audioContext.currentTime + duration)
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
		const AudioContext = window.AudioContext || (window as any).webkitAudioContext
		if (!AudioContext) return

		const audioContext = new AudioContext()
		const oscillator = audioContext.createOscillator()
		const gainNode = audioContext.createGain()

		oscillator.connect(gainNode)
		gainNode.connect(audioContext.destination)

		oscillator.frequency.value = 600
		oscillator.type = 'sine'

		gainNode.gain.setValueAtTime(0, audioContext.currentTime)
		gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
		gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08)

		oscillator.start(audioContext.currentTime)
		oscillator.stop(audioContext.currentTime + 0.08)
	} catch (e) {}
}

export function useTimer({
	mode,
	workTime,
	restTime,
	totalRounds,
	amrapTime,
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
		// Sonido de inicio cuando termina la cuenta regresiva (campana larga y aguda)
		if (lastCountdownRef.current !== null && countdown === null && isRunning) {
			playStartBeep()
			lastCountdownRef.current = null
		}
	}, [countdown, isRunning, soundEnabled])

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
			const otmIntervalNum = (parseInt(workTime || '1') || 1) * 60
			const secondsIntoInterval = time % otmIntervalNum
			// Últimos 3 segundos del intervalo - campana de conteo
			if (secondsIntoInterval >= otmIntervalNum - 3 && secondsIntoInterval < otmIntervalNum) {
				playCountdownBeep()
			}
		}
	}, [time, mode, isRunning, isPaused, countdown, soundEnabled, workTime])

	// Efecto para sonidos en Tabata (cambio de fase)
	useEffect(() => {
		if (!soundEnabled || !isRunning || isPaused || countdown) return
		if (mode === 'tabata') {
			// Campana larga para cambios de fase
			playStartBeep()
		}
	}, [isWorkPhase, mode, isRunning, isPaused, countdown, soundEnabled])

	// Inicializar tiempo de AMRAP cuando cambia el modo o el tiempo configurado
	useEffect(() => {
		if (mode === 'amrap' && !isRunning && !isPaused) {
			const amrapTimeNum = parseInt(amrapTime) || 10
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
								const amrapTimeNum = parseInt(amrapTime) || 10
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
						const amrapTimeNum = parseInt(amrapTime) || 10
						const restTimeNum = parseInt(restTime) || 60
						const totalRoundsNum = parseInt(totalRounds) || 1
						
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

					if (mode === 'tabata') {
						const workTimeNum = parseInt(workTime) || 20
						const restTimeNum = parseInt(restTime) || 10
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
									const totalRoundsNum = parseInt(totalRounds) || 8
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
						const totalRoundsNum = parseInt(totalRounds) || 10
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
						const totalRoundsNum = parseInt(totalRounds) || 10
						const otmIntervalNum = (parseInt(workTime || '1') || 1) * 60 // Convertir minutos a segundos
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
	}, [isRunning, isPaused, mode, workTime, restTime, totalRounds, isWorkPhase, countdown, currentRound, amrapTime])

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
			const workTimeNum = parseInt(workTime) || 20
			const restTimeNum = parseInt(restTime) || 10
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
		const otmIntervalNum = (parseInt(workTime || '1') || 1) * 60 // Convertir minutos a segundos
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
			const totalRoundsNum = parseInt(totalRounds) || 1
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
			const totalRoundsNum = parseInt(totalRounds) || 1
			// Solo cambiar color si hay múltiples rondas
			if (totalRoundsNum > 1) {
				return isWorkPhase ? 'text-primary' : 'text-green-500'
			}
		}
		return 'text-primary'
	}

	const handleStart = () => {
		// Iniciar cuenta regresiva de 10 segundos para todos los modos
		if ((mode === 'normal' || mode === 'tabata' || mode === 'fortime' || mode === 'amrap' || mode === 'emom' || mode === 'otm') && time === 0 && countdown === null) {
			setCountdown(10)
		}
		// Para AMRAP sin cuenta regresiva (si ya se inició antes y se pausó), restaurar tiempo
		if (mode === 'amrap' && time === 0 && countdown === null && amrapInitialTime > 0 && amrapInitialTime !== 600) {
			setTime(amrapInitialTime)
		}
		setIsRunning(true)
		setIsPaused(false)
	}

	const handlePause = () => {
		setIsPaused(!isPaused)
	}

	const handleReset = (resetToZero = false) => {
		if (mode === 'amrap' && !resetToZero) {
			const amrapTimeNum = parseInt(amrapTime) || 10
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

	const toggleSound = () => {
		setSoundEnabled(prev => !prev)
	}

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