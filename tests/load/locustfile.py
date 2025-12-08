from locust import HttpUser, task, between
import random

class PredatorUser(HttpUser):
    wait_time = between(1, 4)
    token = None

    def on_start(self):
        """Login and get token before tests"""
        # Register/Login flow simulated
        # Since we might run against a fresh DB, let's try to register.
        # If already exists, we login.
        username = f"loadtest_{random.randint(1000, 9999)}"
        email = f"{username}@example.com"
        password = "password123"
        
        with self.client.post("/api/v1/auth/register", json={
            "email": email,
            "password": password,
            "name": "Load Test User"
        }, catch_response=True) as response:
            if response.status_code == 201:
                self.token = response.json().get("access_token")
            elif response.status_code == 400 or response.status_code == 409:
                # Assuming user exists, login
                login_resp = self.client.post("/api/v1/auth/login", json={
                    "email": email, "password": password
                })
                if login_resp.status_code == 200:
                    self.token = login_resp.json().get("access_token")

    @task(3)
    def search_keyword(self):
        """Simulate keyword search"""
        queries = ["Ukraine", "tax", "law", "corruption", "import"]
        q = random.choice(queries)
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
        else:
            headers = {}
        
        self.client.get(f"/api/v1/search?q={q}&mode=text", headers=headers)

    @task(2)
    def search_hybrid(self):
        """Simulate hybrid search which is more expensive"""
        queries = ["machine learning", "neural networks", "export data", "customs declaration"]
        q = random.choice(queries)
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
            self.client.get(f"/api/v1/search?q={q}&mode=hybrid", headers=headers)

    @task(1)
    def view_document(self):
        """View a document details"""
        # We assume some doc IDs exist or can be found. 
        # Ideally we'd pick from previous search results, but for now using a dummy ID or static check
        # that might return 404 but still load tests the app logic.
        self.client.get("/api/v1/documents/doc123", name="/api/v1/documents/[id]")
