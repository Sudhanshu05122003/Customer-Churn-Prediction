import unittest
import json
import time
import io
from app import app

class ChurnSenseTestSuite(unittest.TestCase):
    token = None
    username = f"testuser_{int(time.time())}"
    email = f"test_{int(time.time())}@example.com"
    password = "SecurePassword123!"

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_01_registration(self):
        reg_payload = {
            "username": ChurnSenseTestSuite.username,
            "email": ChurnSenseTestSuite.email,
            "password": ChurnSenseTestSuite.password
        }
        res = self.app.post("/auth/register", json=reg_payload)
        data = json.loads(res.data)
        self.assertEqual(res.status_code, 201)
        self.assertTrue(data.get("success"))

    def test_02_login(self):
        login_payload = {
            "email": ChurnSenseTestSuite.email,
            "password": ChurnSenseTestSuite.password
        }
        res = self.app.post("/auth/login", json=login_payload)
        data = json.loads(res.data)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(data.get("success"))
        ChurnSenseTestSuite.token = data["data"]["token"]
        self.assertIsNotNone(ChurnSenseTestSuite.token)

    def test_03_data_quality_analysis(self):
        headers = {}
        if ChurnSenseTestSuite.token:
            headers["Authorization"] = f"Bearer {ChurnSenseTestSuite.token}"
            
        csv_data = "CreditScore,Age,Tenure,Balance,NumOfProducts,HasCrCard,IsActiveMember,EstimatedSalary\n600,40,3,60000,2,1,1,50000"
        
        response = self.app.post(
            "/api/quality/analyze",
            data={"file": (io.BytesIO(csv_data.encode()), "test.csv")},
            content_type="multipart/form-data",
            headers=headers
        )
        self.assertEqual(response.status_code, 200)

    def test_04_campaign_creation(self):
        headers = {}
        if ChurnSenseTestSuite.token:
            headers["Authorization"] = f"Bearer {ChurnSenseTestSuite.token}"
            
        payload = {
            "name": "Loyalty Offer",
            "target": "VIP customers",
            "offer": "15% discount",
            "channel": "Email"
        }
        res = self.app.post("/api/campaigns", json=payload, headers=headers)
        data = json.loads(res.data)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(data.get("success"))

if __name__ == "__main__":
    unittest.main()
