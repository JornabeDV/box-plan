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
				setTime(prevTime => {
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

						if (cycleTime === 0 && newTime > 0) {
							setIsWorkPhase(!isWorkPhase)

							if (isWorkPhase) {
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
	}, [isRunning, isPaused, mode, workTime, restTime, totalRounds, isWorkPhase])

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
			return isWorkPhase ? workTimeNum - cycleTime : restTimeNum - cycleTime
		}
		return time
	}

	const getDisplayTime = () => {
		if (mode === 'tabata') {
			return formatTime(getCurrentPhaseTime())
		}
		if (mode === 'amrap') {
			return formatTime(Math.max(0, time))
		}
		return formatTime(time)
	}

	const getPhaseText = () => {
		if (mode === 'tabata') {
			return isWorkPhase ? 'TRABAJO' : 'DESCANSO'
		}
		return 'TIEMPO'
	}

	const getPhaseColor = () => {
		if (mode === 'tabata') {
			return isWorkPhase ? 'text-primary' : 'text-secondary'
		}
		return 'text-primary'
	}

	const handleStart = () => {
		if (mode === 'amrap' && time === 0) {
			const amrapTimeNum = parseInt(amrapTime) || 10
			const amrapTimeInSeconds = amrapTimeNum * 60
			setTime(amrapTimeInSeconds)
			setAmrapInitialTime(amrapTimeInSeconds)
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
		getDisplayTime,
		getPhaseText,
		getPhaseColor,
		handleStart,
		handlePause,
		handleReset,
	}
}

export type { TimerMode }