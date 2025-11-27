'use client'

import { useState, useEffect, useRef } from 'react'

type TimerMode = 'normal' | 'tabata' | 'fortime' | 'amrap' | 'emom' | 'otm'

interface UseTimerProps {
	mode: TimerMode
	workTime: string
	restTime: string
	totalRounds: string
	amrapTime: string
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
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	// Inicializar tiempo de AMRAP cuando cambia el modo o el tiempo configurado
	useEffect(() => {
		if (mode === 'amrap' && !isRunning && !isPaused) {
			const amrapTimeNum = parseInt(amrapTime) || 10
			const amrapTimeInSeconds = amrapTimeNum * 60
			if (time === 0 || time === amrapInitialTime) {
				setTime(amrapTimeInSeconds)
				setAmrapInitialTime(amrapTimeInSeconds)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, amrapTime])

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
						const newTime = prevTime - 1
						if (newTime <= 0) {
							setIsRunning(false)
							return 0
						}
						return newTime
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
	}, [isRunning, isPaused, mode, workTime, restTime, totalRounds, isWorkPhase, countdown])

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
		return formatTime(time)
	}

	const getPhaseText = () => {
		if ((mode === 'normal' || mode === 'tabata' || mode === 'fortime' || mode === 'amrap' || mode === 'emom' || mode === 'otm') && countdown !== null && countdown > 0) {
			return 'PREPARATE'
		}
		if (mode === 'tabata') {
			return isWorkPhase ? 'TRABAJO' : 'DESCANSO'
		}
		return 'TIEMPO'
	}

	const getPhaseColor = () => {
		if (mode === 'tabata') {
			return isWorkPhase ? 'text-primary' : 'text-green-500'
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
	}

	return {
		time,
		isRunning,
		isPaused,
		currentRound,
		isWorkPhase,
		countdown,
		getDisplayTime,
		getPhaseText,
		getPhaseColor,
		handleStart,
		handlePause,
		handleReset,
	}
}

export type { TimerMode }