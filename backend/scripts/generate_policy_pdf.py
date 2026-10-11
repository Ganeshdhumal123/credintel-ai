import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "sample_documents")
PDF_PATH = os.path.join(DOCS_DIR, "credintel_underwriting_policy.pdf")

def create_policy_pdf():
    os.makedirs(DOCS_DIR, exist_ok=True)
    c = canvas.Canvas(PDF_PATH, pagesize=letter)
    width, height = letter

    # --- PAGE 1: Core Policy & Eligibility ---
    c.setFillColor(colors.HexColor("#0A192F"))
    c.rect(0, height - 70, width, 70, fill=True, stroke=False)
    
    c.setFillColor(colors.HexColor("#64FFDA"))
    c.setFont("Helvetica-Bold", 20)
    c.drawString(40, height - 42, "CredIntel AI — Underwriting Policy & Credit Standards")

    c.setFillColor(colors.white)
    c.setFont("Helvetica", 10)
    c.drawString(40, height - 58, "Document Ref: POL-2026-V1.0  |  Classification: Commercial & Retail Credit Guidelines")

    # Content Page 1
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, height - 100, "1. Executive Summary & Lending Principles")
    
    c.setFont("Helvetica", 10)
    text1 = (
        "CredIntel operates an AI-assisted credit decisioning framework designed to assess borrower creditworthiness, "
        "mitigate systemic default exposure, and ensure equitable lending across retail and commercial portfolios. "
        "All automated machine learning risk predictions augment human underwriting review."
    )
    c.drawString(40, height - 120, text1[:95])
    c.drawString(40, height - 135, text1[95:190])
    c.drawString(40, height - 150, text1[190:])

    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, height - 180, "2. Core Eligibility Criteria")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 200, "• Age Limits: Minimum borrower age is 18 years; maximum age at loan maturity is 70 years.")
    c.drawString(50, height - 215, "• Credit Amount Limits: Minimum unsecured credit is 500 DM; maximum automated credit is 200,000 DM.")
    c.drawString(50, height - 230, "• Duration Range: Loan terms range strictly between 1 month and 72 months (up to 6 years).")
    c.drawString(50, height - 245, "• Terms > 48 months require Tier 1 credit score (A30/A31) or real estate asset backing.")
    c.drawString(50, height - 260, "• Employment Stability: Continuous employment of 1+ years preferred; unemployed require checking >= 200 DM.")

    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, height - 290, "3. Risk Tiers & Default Probability (PD)")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 310, "• LOW RISK (PD < 40%): Expedited automated approval; standard prime interest rates apply.")
    c.drawString(50, height - 325, "• MEDIUM RISK (40% <= PD < 70%): Secondary review; requires compensating liquid reserves or guarantor.")
    c.drawString(50, height - 340, "• HIGH RISK (PD >= 70%): Elevated default propensity; senior credit committee approval mandatory.")

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.gray)
    c.drawString(40, 30, "Page 1 of 2 — CredIntel AI Policy Document POL-2026-V1.0")
    c.showPage()

    # --- PAGE 2: Debt Ratios, Collateral, Guarantors ---
    c.setFillColor(colors.HexColor("#0A192F"))
    c.rect(0, height - 70, width, 70, fill=True, stroke=False)
    
    c.setFillColor(colors.HexColor("#64FFDA"))
    c.setFont("Helvetica-Bold", 18)
    c.drawString(40, height - 45, "Section B — Debt Burdens, Collateral & Guarantors")

    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, height - 100, "4. Installment Rate & Debt-Service Limits")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 120, "• Rate 1 (>= 35% of disposable income): High debt burden; restricted to Low Risk borrowers.")
    c.drawString(50, height - 135, "• Rate 2 (25% to 35% of income): Standard retail personal, automobile, and home improvement financing.")
    c.drawString(50, height - 150, "• Rate 3 (20% to 25% of income): Optimal lending band; flexible tenure terms.")
    c.drawString(50, height - 165, "• Rate 4 (< 20% of income): Favorable low installment pressure; eligible for rate discount.")

    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, height - 200, "5. Collateral & Guarantor Policy")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 220, "• Real Estate (Tier A121): Highest security tier; significantly reduces required loss provisioning.")
    c.drawString(50, height - 235, "• Building Society / Life Insurance (Tier A122): Eligible as supplementary secondary repayment security.")
    c.drawString(50, height - 250, "• Solvent Guarantors (A102 / A103): Legally joint-liable; elevates Medium Risk applications to Approved.")
    c.drawString(50, height - 265, "• No Property / No Assets (A124): Requires positive checking account balance and <= 24 month term.")

    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, height - 300, "6. Regulatory & Fairness Compliance")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 320, "• Transparent Explanations: Every AI prediction must return human-interpretable risk drivers.")
    c.drawString(50, height - 335, "• No Autonomous Adverse Action: Rejections require dual officer confirmation.")
    c.drawString(50, height - 350, "• Audit Trail: Every application, analysis result, and policy retrieval is timestamped and persisted.")

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.gray)
    c.drawString(40, 30, "Page 2 of 2 — CredIntel AI Policy Document POL-2026-V1.0")
    c.showPage()

    c.save()
    print(f"[OK] Generated sample lending policy PDF at: {PDF_PATH}")

if __name__ == "__main__":
    create_policy_pdf()
