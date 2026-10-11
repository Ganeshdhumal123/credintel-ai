import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, roc_auc_score

DATA_DIR = os.path.join(os.path.dirname(__file__), '../../data')
DATA_FILE = os.path.join(DATA_DIR, 'german_credit.csv')
MODEL_DIR = os.path.join(os.path.dirname(__file__), '../app/ml/models')

def train_model():
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)

    print(f"Loading data from {DATA_FILE}...")
    df = pd.read_csv(DATA_FILE)

    X = df.drop('Target', axis=1)
    y = df['Target']

    # Identify categorical and numerical columns
    categorical_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
    numerical_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()

    print(f"Numerical features: {len(numerical_cols)}")
    print(f"Categorical features: {len(categorical_cols)}")

    # Create preprocessing pipelines
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
        ])

    # Create the Random Forest pipeline
    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10))
    ])

    # Split the data
    print("Splitting data into training and testing sets...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Train the model
    print("Training Random Forest model...")
    model_pipeline.fit(X_train, y_train)

    # Evaluate
    print("Evaluating model...")
    y_pred = model_pipeline.predict(X_test)
    y_prob = model_pipeline.predict_proba(X_test)[:, 1]

    print("\n--- Model Evaluation ---")
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(f"ROC AUC: {roc_auc_score(y_test, y_prob):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # Save the model
    model_path = os.path.join(MODEL_DIR, 'loan_model_v1.joblib')
    joblib.dump(model_pipeline, model_path)
    
    print(f"\nModel saved successfully to {model_path}")

if __name__ == "__main__":
    train_model()
