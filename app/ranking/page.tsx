'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { BottomNavigation } from '@/components/layout/bottom-navigation'
import { useAuth } from '@/hooks/use-auth'
import { useRanking } from '@/hooks/use-ranking'
import { RankingHeader } from '@/components/ranking/ranking-header'
import { RankingDateSelector } from '@/components/ranking/ranking-date-selector'
import { RankingCard } from '@/components/ranking/ranking-card'
import { RankingEmptyState } from '@/components/ranking/ranking-empty-state'
import { RankingLoadingScreen } from '@/components/ranking/ranking-loading-screen'
import { RankingUnauthorized } from '@/components/ranking/ranking-unauthorized'

const getInitialDate = (): Date => {
	const yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 1)
	yesterday.setHours(0, 0, 0, 0)
	return yesterday
}

export default function RankingPage() {
	const { user, loading: authLoading } = useAuth()
	const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate)
	const { rankingData, loading } = useRanking(user?.id, selectedDate)

	if (authLoading || loading) {
		return <RankingLoadingScreen />
	}

	if (!user) {
		return <RankingUnauthorized />
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header />

			<main className="p-6 space-y-6 pb-32 max-w-6xl mx-auto">
				<RankingHeader />

				<RankingDateSelector
					selectedDate={selectedDate}
					onDateChange={setSelectedDate}
					rankingDate={rankingData?.date}
				/>

				{!rankingData || rankingData.rankings.length === 0 ? (
					<RankingEmptyState isLoading={!rankingData} />
				) : (
					rankingData.rankings.map((ranking) => (
						<RankingCard
							key={`${ranking.wod_name}-${ranking.type}`}
							ranking={ranking}
							currentUserId={user?.id as string | number | undefined}
						/>
					))
				)}
			</main>

			<BottomNavigation />
		</div>
	)
}
