# RUPIA V2 — Entity Relationship Diagram & Architecture

This document outlines the database schema architecture for Rupia V2 personal finance intelligence engine.

## Mermaid ER Diagram

```mermaid
erDiagram
    User ||--o{ Session : "has"
    User ||--o{ Wallet : "owns"
    User ||--o{ Transaction : "records"
    User ||--o{ Category : "customizes"
    User ||--o{ Transfer : "executes"
    User ||--o{ Budget : "defines"
    User ||--o{ FinancialObligation : "tracks"
    User ||--o{ Receipt : "scans"
    User ||--o{ ImportBatch : "imports"
    User ||--o{ FinancialGoal : "aims"
    User ||--o{ DailyCheckIn : "submits"
    User ||--o| NotificationPreference : "configures"
    User ||--o{ Notification : "receives"
    User ||--o{ AIConversation : "chats"
    User ||--o{ AuditLog : "logs"

    Wallet ||--o{ Transaction : "contains"
    Wallet ||--o{ Transfer : "source_for"
    Wallet ||--o{ Transfer : "dest_for"
    Wallet ||--o{ FinancialObligation : "pays"

    Category ||--o{ Transaction : "categorizes"
    Category ||--o{ BudgetAllocation : "budgeted_in"
    Category ||--o{ FinancialObligation : "associated_with"

    Budget ||--o{ BudgetAllocation : "allocates"

    Receipt ||--o{ ReceiptLineItem : "contains"
    Receipt ||--o| Transaction : "links_to"

    ImportBatch ||--o{ ImportedTransactionReference : "includes"

    FinancialGoal ||--o{ GoalContribution : "receives"

    AIConversation ||--o{ AIMessage : "contains"

    User {
        string id PK
        string email UK
        string passwordHash
        string name
        string currency
        string timezone
        datetime createdAt
    }

    Wallet {
        string id PK
        string userId FK
        string name
        string type
        bigint openingBalance
        bigint recordedBalance
        bigint lastVerifiedBalance
        datetime lastReconciledAt
    }

    Transaction {
        string id PK
        string userId FK
        string walletId FK
        string categoryId FK
        string type
        bigint amount
        datetime date
        string description
        string merchant
        string idempotencyKey UK
    }

    Transfer {
        string id PK
        string userId FK
        string sourceWalletId FK
        string destinationWalletId FK
        bigint amount
        bigint fee
        datetime date
    }

    Budget {
        string id PK
        string userId FK
        string name
        string period
        datetime startDate
        datetime endDate
        bigint totalLimit
    }

    BudgetAllocation {
        string id PK
        string budgetId FK
        string categoryId FK
        float allocatedPercentage
        bigint allocatedAmount
    }

    Receipt {
        string id PK
        string userId FK
        string imageUrl
        string ocrRawText
        bigint totalAmount
        string status
    }

    ReceiptLineItem {
        string id PK
        string receiptId FK
        string name
        float quantity
        bigint unitPrice
        bigint totalPrice
    }
```

## Monetary Precision Rules
1. **Integer Rupiah Standard**: All currency fields (`amount`, `recordedBalance`, `openingBalance`, `totalLimit`, etc.) are represented as 64-bit integer values (`BigInt`) denominated in whole Rupiah (IDR).
2. **Zero Floating-Point Drift**: Addition, subtraction, balance reconciliation, and transfers never suffer IEEE-754 binary floating-point roundoff errors.
3. **Atomic Multi-Table Updates**: Transfers and balance mutations run inside Prisma transactions (`prisma.$transaction`) ensuring atomic source-decrement and destination-increment.
