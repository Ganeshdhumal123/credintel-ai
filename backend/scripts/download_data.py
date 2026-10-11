import os
import pandas as pd
import urllib.request

DATA_DIR = os.path.join(os.path.dirname(__file__), '../../data')
DATA_FILE = os.path.join(DATA_DIR, 'german_credit.csv')

def download_german_credit_data():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/statlog/german/german.data"
    
    print("Downloading dataset...")
    # The dataset space-separated without headers
    columns = [
        "Status_of_existing_checking_account", "Duration_in_month", "Credit_history", "Purpose",
        "Credit_amount", "Savings_account_bonds", "Present_employment_since",
        "Installment_rate_in_percentage_of_disposable_income", "Personal_status_and_sex",
        "Other_debtors_guarantors", "Present_residence_since", "Property", "Age_in_years",
        "Other_installment_plans", "Housing", "Number_of_existing_credits_at_this_bank",
        "Job", "Number_of_people_being_liable_to_provide_maintenance_for", "Telephone",
        "foreign_worker", "Risk"
    ]
    
    df = pd.read_csv(url, sep=' ', names=columns)
    
    # Target definition:
    # 1 = Good (Approved)
    # 2 = Bad (Default/Rejected)
    # We will map this to 1 = Approved, 0 = Rejected for easier binary classification understanding
    df['Target'] = df['Risk'].map({1: 1, 2: 0})
    df = df.drop('Risk', axis=1)
    
    df.to_csv(DATA_FILE, index=False)
    print(f"Dataset downloaded successfully to {DATA_FILE}")
    print(f"Dataset shape: {df.shape}")
    print("Target distribution:")
    print(df['Target'].value_counts())

if __name__ == "__main__":
    download_german_credit_data()
