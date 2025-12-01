import { useState, useEffect } from 'react'

interface CoachPlan {
	id: number
	name: string
	displayName: string
	minStudents: number
	maxStudents: number
	basePrice: number
	commissionRate: number
	features: any
	isActive: boolean
}

interface PlanFormData {
	displayName: string
	minStudents: number
	maxStudents: number
	basePrice: number
	commissionRate: number
	features: Record<string, any>
	isActive: boolean
}

export function usePlanForm(plan: CoachPlan | null, isOpen: boolean) {
	const [formData, setFormData] = useState<PlanFormData>({
		displayName: '',
		minStudents: 1,
		maxStudents: 10,
		basePrice: 0,
		commissionRate: 0,
		features: {},
		isActive: true
	})

	useEffect(() => {
		if (isOpen && plan) {
			const features =
				typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features || {}

			setFormData({
				displayName: plan.displayName,
				minStudents: plan.minStudents,
				maxStudents: plan.maxStudents,
				basePrice: plan.basePrice,
				commissionRate: plan.commissionRate,
				features,
				isActive: plan.isActive
			})
		}
	}, [isOpen, plan])

	const updateField = (field: string, value: string | number | boolean) => {
		setFormData((prev) => ({
			...prev,
			[field]: value
		}))
	}

	const updateFeature = (feature: string, value: boolean | number | string) => {
		setFormData((prev) => ({
			...prev,
			features: {
				...prev.features,
				[feature]: value
			}
		}))
	}

	const removeFeature = (feature: string) => {
		setFormData((prev) => {
			const newFeatures = { ...prev.features }
			delete newFeatures[feature]
			return {
				...prev,
				features: newFeatures
			}
		})
	}

	return {
		formData,
		updateField,
		updateFeature,
		removeFeature
	}
}
