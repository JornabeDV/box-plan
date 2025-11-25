'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { BottomNavigation } from '@/components/layout/bottom-navigation'
import { TimerModeSelector } from '@/components/timer/timer-mode-selector'
import { TimerConfig } from '@/components/timer/timer-config'
import { TimerDisplay } from '@/components/timer/timer-display'
import { TimerInfo } from '@/components/timer/timer-info'
import { useTimer, TimerMode } from '@/hooks/use-timer'

export default function TimerPage() {
	const [mode, setMode] = useState<TimerMode>('normal')
	const [workTime, setWorkTime] = useState('20')
	const [restTime, setRestTime] = useState('10')
	const [totalRounds, setTotalRounds] = useState('8')
	const [amrapTime, setAmrapTime] = useState('10')

	const {
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
	} = useTimer({
		mode,
		workTime,
		restTime,
		totalRounds,
		amrapTime,
	})

	const handleModeChange = (newMode: TimerMode) => {
		setMode(newMode)
		handleReset(true)
		setWorkTime('20')
		setRestTime('10')
		setTotalRounds('8')
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
			<Header />

			<main className="p-6 space-y-6 pb-24">
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-heading">Timer CrossFit</h1>
					<p className="text-muted-foreground">Herramientas de entrenamiento especializadas</p>
				</div>

				<TimerModeSelector mode={mode} onModeChange={handleModeChange} />

				<TimerConfig
					mode={mode}
					workTime={workTime}
					restTime={restTime}
					totalRounds={totalRounds}
					amrapTime={amrapTime}
					isRunning={isRunning}
					isPaused={isPaused}
					onWorkTimeChange={setWorkTime}
					onRestTimeChange={setRestTime}
					onTotalRoundsChange={setTotalRounds}
					onAmrapTimeChange={setAmrapTime}
				/>

				<TimerDisplay
					mode={mode}
					currentRound={currentRound}
					totalRounds={totalRounds}
					displayTime={getDisplayTime()}
					phaseText={getPhaseText()}
					phaseColor={getPhaseColor()}
					isRunning={isRunning}
					isPaused={isPaused}
					onStart={handleStart}
					onPause={handlePause}
					onReset={handleReset}
				/>

				<TimerInfo mode={mode} />
			</main>

			<BottomNavigation />
		</div>
	)
}