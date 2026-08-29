# RecoverAI — Revenue Recovery & Decision Intelligence Platform

> **Track 3: AI Revenue Recovery** | High-Performance FinTech Decision Intelligence & Operator Command Center

![RecoverAI Architecture](https://img.shields.io/badge/Architecture-Deterministic%20Guardrails%20%2B%20AI%20Decision%20Models-blueviolet)
![Tests](https://img.shields.io/badge/Automated%20Tests-98%2F98%20Passed%20(100%25)-emerald)
![Database](https://img.shields.io/badge/Database-PostgreSQL%2016-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20TailwindCSS-cyan)
![Node](https://img.shields.io/badge/Node.js-v18%2B-green)

---

## 1. Project Overview

**RecoverAI** is an institutional-grade revenue recovery and decision intelligence platform designed to eliminate payment failure leakage in digital commerce and payment gateways.

The platform continuously analyzes failed payment events, estimates empirical recovery probabilities, formulates dynamic retry strategies (e.g., smart delays, route switching), and enforces **5 hard deterministic safety guardrails** before executing autonomous recoveries or escalating high-risk cases for human operator authorization. Every decision and safety check is permanently recorded in a cryptographically ordered compliance audit trail.

---

## 2. Problem Statement

In digital payments (UPI, Cards, Netbanking, Wallets), **15% to 25% of transaction attempts fail** due to:
1. Transient network timeouts and gateway drops.
2. Temporary issuing/acquiring bank downtime.
3. Insufficient funds or card limit caps.
4. Friction during multi-factor authentication (MFA/OTP).

### Why Payment Failures Matter:
* **Revenue Leakage**: Merchants lose significant Gross Merchandise Value (GMV) on high-intent checkouts.
* **Customer Churn**: Consumers abandon carts upon initial failure and switch to competitors.
* **Over-Retry Penalties**: Blindly retrying payments leads to gateway throttling, bank penalty fees, customer fatigue, and accidental duplicate billing.

---

## 3. The RecoverAI Solution

RecoverAI replaces static retry mechanisms with an **intelligent, risk-aware recovery pipeline**:
* **Smart Failure Diagnosis**: Differentiates retryable transient errors from non-retryable terminal declines.
* **Multi-Factor Probability Modeling**: Synthesizes failure reasons, retry counts, channel reliability, and fraud scores.
* **Deterministic Guardrails**: 5 hard-coded rule barriers that **strictly constrain AI recommendations before execution**, preventing unsafe or unauthorized operations.
* **Human-in-the-Loop Escalations**: High-exposure and anomalous transactions mandate explicit operator sign-off.
* **Hashed Compliance Audit Logging**: Guaranteed traceability and non-repudiation for every automated and operator decision.

---

## 4. Key Features

* **Executive Command Center**: Real-time HUD telemetry displaying Gross Volume, Failed Revenue, Weighted Revenue at Risk, and Recovery Opportunities.
* **High-Density Telemetry Stream**: Search, multi-filter, and sort across 1,000 live transaction streams with instant modal inspection.
* **Prioritized Recovery Targets**: Yield-ranked candidate matrix segmented into *Safe to Automate* vs *Operator Sign-Off Required*.
* **Operator Sign-Off Station**: Dedicated escalation console with 1-click Approve/Reject decision workflows and auditable justification tracking.
* **Revenue Intelligence Analytics**: Cross-channel failure rate breakdowns, decline root-cause exposure charts, and AI decision distribution metrics.
* **Cryptographic Compliance Timeline**: Chronological event logs with expandable 5-point guardrail verification checklists.
* **Autonomous Mission Control (Batch AI)**: Idempotent 1-click batch analysis across unanalyzed payment failures.

---

## 5. Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS, Recharts, Lucide Icons, Canvas Particles |
| **Backend** | Node.js, Express.js, REST API Gateway |
| **Database** | PostgreSQL 16 (Relational tables, Lateral joins, JSONB payload storage) |
| **Testing** | Node.js Native Assert Test Suite (Attack & Stress Suite, Recovery Workflow Suite) |
| **Security** | Parameterized SQL Queries, Whitelisted Column Sorting, Guardrail Isolation |

---

## 6. Project Structure

```
recoverai/
├── .env.example                     # Root environment configuration template
├── .gitignore                       # Global Git ignore rules (protects credentials)
├── README.md                        # Master project documentation
├── client/                          # React + Vite Frontend Command Center
│   ├── .gitignore                   # Client-specific ignore rules
│   ├── index.html                   # HTML entry point with telemetry fonts
│   ├── package.json                 # Client dependencies & scripts
│   ├── postcss.config.js            # PostCSS configuration
│   ├── tailwind.config.js           # Cyber theme design tokens & animations
│   ├── vite.config.js               # Vite config with /api proxy to port 5000
│   ├── public/                      # Static SVG icons and favicon
│   └── src/
│       ├── App.jsx                  # Main app shell & global state manager
│       ├── index.css                # Global styles, space gradients & keyframes
│       ├── main.jsx                 # React root renderer
│       ├── components/
│       │   ├── AnimatedNumber.jsx   # RAF smooth number counter
│       │   ├── BatchAnalysisModal.jsx # Mission Control batch execution modal
│       │   ├── HumanReviewModal.jsx # Operator sign-off modal
│       │   ├── Navbar.jsx           # Top command bar with live telemetry
│       │   ├── Sidebar.jsx          # Futuristic navigation & sentinel status
│       │   ├── SkeletonLoader.jsx   # Shimmer skeleton loading components
│       │   ├── StarfieldBackground.jsx # Ambient space particle canvas
│       │   └── TransactionDetailModal.jsx # Full telemetry & guardrail console
│       ├── pages/
│       │   ├── AnalyticsPage.jsx    # Revenue intelligence & channel analytics
│       │   ├── AuditTrailPage.jsx   # Immutable compliance audit log
│       │   ├── HumanReviewPage.jsx  # Operator escalation queue
│       │   ├── OpportunitiesPage.jsx # Recovery candidates & yield matrix
│       │   ├── OverviewPage.jsx     # Executive Command Center overview
│       │   └── TransactionsPage.jsx # High-density telemetry data stream
│       ├── services/
│       │   └── api.js               # REST client for all 10 endpoint categories
│       └── utils/
│           └── formatters.js        # INR currency, percentages, timestamps
└── server/                          # Node.js + Express Backend API
    ├── .env                         # Local environment variables (IGNORED BY GIT)
    ├── .env.example                 # Server environment template
    ├── .gitignore                   # Server secret protection rules
    ├── db.js                        # PostgreSQL connection pool setup
    ├── package.json                 # Server dependencies & scripts
    ├── server.js                    # Express server entry point (Port 5000)
    ├── agents/
    │   └── recoveryAgent.js         # Multi-factor AI analysis & scoring logic
    ├── routes/
    │   └── recoveryRoutes.js        # REST API endpoints & route handlers
    ├── scripts/
    │   └── generateTransactions.js  # 1,000 synthetic transaction generator
    ├── services/
    │   ├── guardrails/
    │   │   └── guardrailEngine.js   # 5 deterministic barrier rule checks
    │   └── recoveryEngine.js        # DB operations, queries & batch workflows
    └── tests/
        ├── attack_suite.test.js     # 73-point recruiter attack & stress test suite
        └── recovery_workflow.test.js # 25-point logic audit workflow test suite
```

---

## 7. System Architecture

```
                               ┌────────────────────────────────────────────────┐
                               │       TRANSACTION INGESTION / GATEWAY STREAM   │
                               │           (1,000 PostgreSQL Telemetry Records)  │
                               └───────────────────────┬────────────────────────┘
                                                       │
                                                       ▼
                               ┌────────────────────────────────────────────────┐
                               │         MULTI-FACTOR RECOVERY AGENT             │
                               │   - Evaluates decline reason & channel weight   │
                               │   - Computes recovery score & confidence        │
                               │   - Formulates strategy: WAIT_AND_RETRY, etc.  │
                               └───────────────────────┬────────────────────────┘
                                                       │
                                                       ▼
                               ┌────────────────────────────────────────────────┐
                               │      5 DETERMINISTIC SAFETY GUARDRAILS         │
                               │   [1] TRANSACTION_FAILED (Strict status check) │
                               │   [2] RETRY_LIMIT (Max 2 retries allowed)      │
                               │   [3] FRAUD_SCORE (Risk < 0.70 threshold)      │
                               │   [4] TRANSACTION_AMOUNT (Cap <= ₹50,000)       │
                               │   [5] AI_CONFIDENCE (Certainty >= 0.75)        │
                               └───────────────┬────────────────┬───────────────┘
                                               │                │
                        All Guardrails Passed  │                │ Guardrail Triggered (Escalated)
                                               ▼                ▼
                     ┌───────────────────────────┐   ┌───────────────────────────┐
                     │    AUTONOMOUS RECOVERY    │   │ OPERATOR SIGN-OFF STATION │
                     │   (Status: 'APPROVED',    │   │   (Status: 'PENDING',     │
                     │   requires_human: false)  │   │   requires_human: true)   │
                     └─────────────┬─────────────┘   └─────────────┬─────────────┘
                                   │                               │
                                   └───────────────┬───────────────┘
                                                   │
                                                   ▼
                               ┌────────────────────────────────────────────────┐
                               │         POSTGRESQL IMMUTABLE AUDIT LOGS        │
                               │  (Action ID, Actor, Decision, Guardrail JSON)  │
                               └────────────────────────────────────────────────┘
```

---

## 8. AI Decision & Recovery Logic

> **Note on AI and Guardrail Decoupling**: AI models are inherently probabilistic and capable of generating inaccurate or risky recommendations. Rather than assuming the AI is infallible, RecoverAI uses the AI engine to *propose* recovery strategies and probabilities, but enforces **hard-coded deterministic guardrails** in software to constrain and validate every proposed action before execution.

### Mathematical Recovery Model
The recovery probability $P(\text{recovery}) \in [0.0, 1.0]$ is calculated as:
$$P(\text{recovery}) = \text{BaseProb}(\text{DeclineReason}) \times (1 - 0.25 \times \text{RetryCount}) \times (1 - 0.40 \times \text{FraudScore})$$

#### Reason Baselines:
* `UPI_TIMEOUT` / `NETWORK_ERROR` / `PAYMENT_TIMEOUT`: **0.85** (Transient infrastructure drops)
* `BANK_DECLINED`: **0.65** (Temporary bank load / issuer throttling)
* `INSUFFICIENT_FUNDS` / `CARD_DECLINED`: **0.20** (Customer terminal decline)

#### Action Mapping:
* $P(\text{recovery}) \ge 0.70 \implies$ **`WAIT_AND_RETRY`** (Schedule smart retry after 30–60s)
* $0.40 \le P(\text{recovery}) < 0.70 \implies$ **`ROUTE_FALLBACK`** (Switch payment rail, e.g. UPI to Card)
* $P(\text{recovery}) < 0.40 \implies$ **`NO_ACTION`** (Prevent unnecessary retry costs)

---

## 9. Deterministic Guardrail Layer

| Guardrail Rule | Target Field | Enforcement Policy | Failure Outcome |
| :--- | :--- | :--- | :--- |
| **`TRANSACTION_FAILED`** | `status` | Succeeded transactions cannot enter recovery. | **`BLOCKED`** (Immediate exit, 0 rows) |
| **`RETRY_LIMIT`** | `retry_count` | Maximum 2 retries allowed per transaction. | **`BLOCKED`** (Flooding protection) |
| **`FRAUD_SCORE`** | `fraud_score` | Fraud score must be $< 0.70$. | **`ESCALATED`** (Mandatory operator sign-off) |
| **`TRANSACTION_AMOUNT`**| `amount` | Transaction value must be $\le \text{₹}50,000$. | **`ESCALATED`** (High exposure sign-off) |
| **`AI_CONFIDENCE`** | `confidence` | Model confidence must be $\ge 0.75$. | **`ESCALATED`** (Ambiguity sign-off) |

---

## 10. Human-in-the-Loop Workflow

When an action is flagged with `requires_human = true`:
1. It is routed to the **Operator Sign-Off Station** with status `PENDING`.
2. The UI highlights the exact guardrail trigger (e.g., *Amount > ₹50,000*).
3. The operator can:
   * **APPROVE**: Sets `status = 'APPROVED'`, `requires_human = false`, `result = 'APPROVED_BY_HUMAN'`, and logs compliance telemetry.
   * **REJECT**: Sets `status = 'REJECTED'`, `requires_human = false`, `result = 'REJECTED_BY_HUMAN'`, and logs compliance telemetry.
4. **State Machine Protection**: Re-reviewing an already completed action is strictly blocked with `400 Bad Request`.

---

## 11. Database Schema Overview

```sql
-- 1. Master Transactions Table (1,000 Ground Truth Records)
CREATE TABLE transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_method VARCHAR(20) NOT NULL,       -- UPI, CARD, NETBANKING, WALLET
    status VARCHAR(20) NOT NULL,               -- SUCCESS, FAILED
    failure_reason VARCHAR(100),               -- UPI_TIMEOUT, BANK_DECLINED, etc.
    retry_count INT DEFAULT 0,
    fraud_score NUMERIC(5, 4) DEFAULT 0.0,
    bank VARCHAR(50),
    upi_app VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Recovery Actions Table
CREATE TABLE recovery_actions (
    action_id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) REFERENCES transactions(transaction_id),
    action_type VARCHAR(50) NOT NULL,          -- WAIT_AND_RETRY, ROUTE_FALLBACK, MANUAL_RETRY, NO_ACTION
    status VARCHAR(20) NOT NULL,               -- APPROVED, PENDING, BLOCKED, REJECTED
    confidence NUMERIC(5, 4) NOT NULL,
    requires_human BOOLEAN DEFAULT false,
    reason TEXT NOT NULL,
    result VARCHAR(50),                        -- PENDING_EXECUTION, APPROVED_BY_HUMAN, REJECTED_BY_HUMAN
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Immutable Compliance Audit Logs Table
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL,
    action_id INT REFERENCES recovery_actions(action_id),
    actor VARCHAR(50) NOT NULL,                -- AI_AGENT, RiskOfficer_Lead, etc.
    event_type VARCHAR(50) NOT NULL,           -- RECOVERY_ANALYSIS, HUMAN_REVIEW
    decision VARCHAR(50) NOT NULL,
    guardrails_checked JSONB NOT NULL,         -- Array of boolean check outcomes
    outcome VARCHAR(50) NOT NULL,              -- ACTION_APPROVED, ACTION_BLOCKED, ACTION_REJECTED
    reasoning TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 12. API Endpoints

### Base URL: `http://localhost:5000/api/recovery`

| Method | Endpoint | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| **GET** | `/analytics/summary` | Platform KPIs & revenue aggregates. | None |
| **GET** | `/analytics/payment-methods`| Breakdown of volume & failure rates by channel. | None |
| **GET** | `/analytics/failure-reasons`| Decline code counts, risk amount, and mean probability.| None |
| **GET** | `/opportunities` | Filtered list of qualified recovery candidates. | None |
| **GET** | `/transactions` | Paginated transaction telemetry stream. | `search`, `status`, `payment_method`, `page`, `limit` |
| **GET** | `/actions` | Recovery actions list filtered by review status. | `requires_human`, `status`, `page`, `limit` |
| **GET** | `/audit-logs` | Chronological immutable audit trail events. | `transaction_id`, `event_type`, `page`, `limit` |
| **GET** | `/analyze/:transactionId` | Single-transaction analysis & guardrail validation. | `transactionId` (URL parameter) |
| **POST**| `/batch-analyze` | Batch execution across all unanalyzed failures. | `{ "limit": 200 }` |
| **POST**| `/review/:actionId` | Operator sign-off approval or rejection. | `{ "decision": "APPROVE", "reviewer": "RiskLead", "reason": "..." }` |

---

## 13. Local Setup Instructions

### Prerequisites:
* **Node.js**: v18.0.0 or higher
* **PostgreSQL**: v14.0 or higher
* **Git**

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/recoverai.git
cd recoverai
```

### Step 2: Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your local PostgreSQL credentials (e.g. DB_PORT=8469 or 5432)
npm start
```
*Backend runs on `http://localhost:5000`.*

### Step 3: Frontend Setup
```bash
cd ../client
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000` with automatic `/api` proxying.*

---

## 14. Environment Variables

Create `server/.env` based on `server/.env.example`:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=recoverai
DB_PASSWORD=your_secure_password
DB_PORT=8469
PORT=5000
NODE_ENV=development
```

---

## 15. Testing & Verification

RecoverAI incorporates a dual-layer automated testing suite with **98 automated assertions**:

```bash
# Run Recruiter-Level Attack & Stress Test Suite (73 Assertions)
node server/tests/attack_suite.test.js

# Run Recovery Workflow Test Suite (25 Assertions)
node server/tests/recovery_workflow.test.js
```

### Test Results Summary:
$$\mathbf{98\text{ Automated Assertions Tested}} \quad \vert \quad \mathbf{98\text{ Passed (100\% Success Rate)}} \quad \vert \quad \mathbf{0\text{ Failures}}$$

```
================================================================================
 🛡️  RECOVERAI RECRUITER-LEVEL ATTACK & STRESS TEST SUITE
================================================================================
CATEGORY 1: Transaction Safety, Boundary Validation & Idempotency   [17/17 PASS]
CATEGORY 2: Batch Analysis Ingestion Purity & Multi-Run Idempotency [ 8/8  PASS]
CATEGORY 3: Human Review State Machine & Adversarial Attack Vectors  [16/16 PASS]
CATEGORY 4: 5 Deterministic Guardrail Safety Checks                  [ 5/5  PASS]
CATEGORY 5: Audit Trail Immutability & Event Tracing                 [ 7/7  PASS]
CATEGORY 6: API Robustness, Query Injections & Bounds Testing        [ 9/9  PASS]
CATEGORY 7: Enterprise Data Consistency Verification                 [ 7/7  PASS]
--------------------------------------------------------------------------------
 📊 STRESS & ATTACK TEST SUMMARY: Total: 73 | Passed: 73 | Failed: 0
 📊 WORKFLOW LOGIC TEST SUMMARY: Total: 25 | Passed: 25 | Failed: 0
 🏆 ZERO DEFECTS FOUND. All security, state machine, and consistency assertions passed!
================================================================================
```

---

## 16. Screenshots & Demo Preview

> *Note: Place high-resolution dashboard screenshots in `docs/screenshots/` before public presentation.*

* **Executive Command Center**: `/docs/screenshots/overview_dashboard.png` (Live telemetry HUD, gross vs failed volume, decline root causes).
* **Telemetry Stream**: `/docs/screenshots/transactions_table.png` (Multi-attribute transaction filtering and inspection console).
* **Operator Sign-Off Station**: `/docs/screenshots/human_review_queue.png` (Escalation queue with guardrail triggers).
* **Transaction Analysis Console**: `/docs/screenshots/transaction_modal.png` (5-point Guardrail Security Sentinel & mathematical model breakdown).
* **Revenue Intelligence**: `/docs/screenshots/analytics_charts.png` (Channel failure rate comparisons and revenue at risk charts).
* **Compliance Audit Trail**: `/docs/screenshots/audit_timeline.png` (Immutable event log with expandable JSON payloads).

---

## 17. Future Improvements

1. **Live Webhook Streaming**: Real-time webhook listeners for live payment gateway failure event streams (Razorpay/Stripe).
2. **Adaptive Machine Learning**: Bayesian dynamic parameter estimation based on acquiring bank latency and bank downtime status feeds.
3. **Multi-Tenant Merchant Dashboards**: Role-based access control (RBAC) with customizable merchant retry policies and SLA alerting.

---

### Developed for Razorpay Major Project / Hackathon Evaluation.
