import unittest
from app.services.search_fusion import reciprocal_rank_fusion

class TestSearchFusion(unittest.TestCase):
    
    def test_rrf_basic_fusion(self):
        # Case: 
        # Doc A is #1 in Keyword (OS)
        # Doc B is #1 in Vector (Vec)
        # Doc C is #2 in both (Common ground)
        
        results_os = [
            {"id": "A", "title": "Doc A"},
            {"id": "C", "title": "Doc C"},
            {"id": "D", "title": "Doc D"}
        ]
        
        results_vec = [
            {"id": "B", "title": "Doc B"},
            {"id": "C", "title": "Doc C"},
            {"id": "E", "title": "Doc E"}
        ]
        
        # Run Fusion
        fused = reciprocal_rank_fusion(results_os, results_vec, k=60)
        
        # Check assertions
        # Score A = 1/60 = 0.01666
        # Score B = 1/60 = 0.01666
        # Score C = 1/61 + 1/61 = 0.01639 + 0.01639 = 0.03278
        
        # Expected order: C, A/B, D/E
        self.assertEqual(fused[0]["id"], "C")
        self.assertAlmostEqual(fused[0]["score"], (1/61 + 1/61), places=4)
        
        # A and B should be roughly equal (floating point nuances aside)
        scores = {d["id"]: d["score"] for d in fused}
        self.assertAlmostEqual(scores["A"], 1/60, places=4)
        self.assertAlmostEqual(scores["B"], 1/60, places=4)
        
        print("\n✅ RRF Test Passed: Hybrid logic prioritizes intersection correctly.")

if __name__ == '__main__':
    unittest.main()
