import os
import random

random.seed(42)
N = 100

feature_cols = [
    "Gender", "Age", "Tenure", "Balance",
    "NumOfProducts", "HasCrCard", "IsActiveMember", "EstimatedSalary"
]

rows = []
# Header
rows.append(",".join(feature_cols))

for _ in range(N):
    gender = random.choice([0, 1])
    age = random.randint(18, 75)
    tenure = random.randint(0, 10)
    balance = round(random.uniform(0, 250000), 2)
    num_products = random.choice([1, 2, 3, 4])
    has_cr_card = random.choice([0, 1])
    is_active = random.choice([0, 1])
    est_salary = round(random.uniform(10000, 200000), 2)
    
    row = [
        str(gender), str(age), str(tenure), f"{balance:.2f}",
        str(num_products), str(has_cr_card), str(is_active), f"{est_salary:.2f}"
    ]
    rows.append(",".join(row))

csv_content = "\n".join(rows) + "\n"

# Save to backend parent (root workspace folder)
root_csv = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sample_data.csv")
with open(root_csv, "w", encoding="utf-8") as f:
    f.write(csv_content)
print(f"Saved root sample data to: {os.path.abspath(root_csv)}")

# Save to Next.js public folder
frontend_csv = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend-next", "public", "sample-data.csv")
with open(frontend_csv, "w", encoding="utf-8") as f:
    f.write(csv_content)
print(f"Saved frontend public sample data to: {os.path.abspath(frontend_csv)}")
