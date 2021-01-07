export enum BudgetType {
    COST = "COST",
    RI_COVERAGE = "RI_COVERAGE",
    RI_UTILIZATION = "RI_UTILIZATION",
    SAVINGS_PLANS_COVERAGE = "SAVINGS_PLANS_COVERAGE",
    SAVINGS_PLANS_UTILIZATION = "SAVINGS_PLANS_UTILIZATION",
    USAGE = "USAGE"
}

export enum TimeUnit {
    ANNUALLY = "ANNUALLY",
    DAILY = "DAILY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY"
}

export enum NotificationType {
    ACTUAL = "ACTUAL",
    FORECASTED = "FORECASTED"
}

export enum ComparisonOperator {
    EQUAL_TO = "EQUAL_TO",
    GREATER_THAN = "GREATER_THAN",
    LESS_THAN = "LESS_THAN"
}

export enum SubscriptionType {
    EMAIL = "EMAIL",
    SNS = "SNS"
}