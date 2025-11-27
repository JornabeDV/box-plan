"use client";

import { useState, useEffect } from "react";
import { useWorkouts } from "./use-workouts";

export function useProgressStats(userId?: string) {
	const { getUserStats } = useWorkouts(userId);
	const [stats, setStats] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadStats = async () => {
			if (userId && getUserStats) {
				setLoading(true);
				try {
					const statsData = await getUserStats();
					setStats(statsData);
				} catch (error) {
					console.error("Error loading stats:", error);
					setStats(null);
				} finally {
					setLoading(false);
				}
			}
		};
		loadStats();
	}, [userId, getUserStats]);

	return { stats, loading };
}
