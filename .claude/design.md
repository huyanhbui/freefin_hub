# design.md — why FreeFin is built this way

Short list. There is no `README.md`. The full reasons are in `rmit 26.md`. Section names are given so they can be found.
If this file and `rmit 26.md` disagree, stop and ask the user.

## Product

1. One platform does three jobs: job matching, loan support with a guarantee, repayment advances —
   because work creates transactions, transactions create fees and data, and data helps pick who gets a guarantee.
   (`rmit 26.md` → "Mô hình", "CƠ CHẾ VỀ QUYỀN ĐƯỢC BẢO LÃNH")
2. Using the app does not give a guarantee automatically. Transactions only open the right to be assessed —
   to limit fraud and losses. (→ "10. Eligibility and guarantee limits")
3. The bank makes the lending decision, not the platform. The guarantee has a cap. (→ "11. How the guarantee works")
4. First users: creative freelancers (video, design, marketing) aged 22–32 who already have clients,
   plus small businesses that hire them — clear need for equipment loans and escrow. (→ "### 5")
5. All numbers are assumptions until a pilot proves them. (→ "Validation before expansion")

## Business

6. Revenue: 5% transaction fee (2% for clients users bring in), guarantee fee, loan setup fee.
   (→ "13. Revenue model and customer acquisition", "14. Finance")
