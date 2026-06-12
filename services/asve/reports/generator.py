import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class ReportGenerator:
    def build(self, infra, data, dom, flow):
        try:
            score = self.calculate_score(infra, data, dom, flow)
            report = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "infra": infra,
                "data": data,
                "dom": dom,
                "flow": flow,
                "final_score": score,
                "status": "READY" if score >= 95 else "DEGRADED"
            }
            
            # Save report to a file
            self.save_report(report)
            return report
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            return {"status": "FAIL", "error": str(e)}

    def calculate_score(self, infra, data, dom, flow):
        # Basic scoring logic
        score = 100.0
        if infra.get("status") != "OK":
            score -= 20.0
        if data.get("consistency") != "CONSISTENT":
            score -= 20.0
        if dom.get("status") != "HYDRATED":
            score -= 20.0
        if flow.get("lossless") != True:
            score -= 20.0
        return max(0.0, score)
        
    def save_report(self, report):
        import os
        os.makedirs("reports", exist_ok=True)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"reports/ASVE_REPORT_{timestamp}.json"
        
        with open(filename, "w") as f:
            json.dump(report, f, indent=4)
        logger.info(f"Report saved to {filename}")
