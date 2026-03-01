export type Role = 'admin' | 'employee'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type RedemptionStatus = 'pending' | 'approved' | 'delivered'

export interface Profile {
    id: string
    name: string
    email: string
    role: Role
    total_points: number
    is_active: boolean
    created_at: string
}

export interface Review {
    id: string
    employee_id: string
    review_link: string
    screenshot_url: string
    status: ReviewStatus
    points_awarded: number
    rejection_reason?: string
    created_at: string
    profiles?: Profile
}

export interface Reward {
    id: string
    title: string
    description?: string
    points_required: number
    is_active: boolean
    created_at: string
}

export interface Redemption {
    id: string
    employee_id: string
    reward_id: string
    status: RedemptionStatus
    created_at: string
    profiles?: Profile
    rewards?: Reward
}
