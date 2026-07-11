from locust import HttpUser, task, between

class PredatorLoadTestUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def view_dashboard(self):
        """Симуляція перегляду дашбордів"""
        self.client.get("/api/v1/health") # Replace with actual dashboard API endpoint

    @task(1)
    def ai_chat_query(self):
        """Симуляція запитів до AI (важкі запити)"""
        self.client.post("/api/v1/chat/completions", json={"query": "Test query for load test", "user_profile": "analyst"})

    def on_start(self):
        """Дії при старті симуляції (наприклад, логін)"""
        pass
