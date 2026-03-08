import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class ValuationEngine:
    """
    Valuation Engine (COMP-244)
    Computes company valuation using Discounted Cash Flow (DCF) 
    and standard multiples (EV/EBITDA, P/E).
    """
    def __init__(self):
        pass

    def calculate_dcf(self, free_cash_flows: List[float], discount_rate: float, 
                      terminal_growth_rate: float, shares_outstanding: int) -> Dict[str, Any]:
        """
        Calculates the Discounted Cash Flow valuation.
        """
        if discount_rate <= terminal_growth_rate:
            return {"error": "Discount rate must be strictly greater than terminal growth rate."}
            
        if not free_cash_flows:
            return {"error": "No cash flows provided."}

        pv_cash_flows = 0.0
        n_years = len(free_cash_flows)
        
        # Calculate Present Value of Free Cash Flows
        for i, cf in enumerate(free_cash_flows, start=1):
            pv_cash_flows += cf / ((1 + discount_rate) ** i)
            
        # Calculate Terminal Value using Gordon Growth Model
        final_cf = free_cash_flows[-1]
        terminal_value = (final_cf * (1 + terminal_growth_rate)) / (discount_rate - terminal_growth_rate)
        
        # Discount Terminal Value to present
        pv_terminal_value = terminal_value / ((1 + discount_rate) ** n_years)
        
        enterprise_value = pv_cash_flows + pv_terminal_value
        
        implied_share_price = enterprise_value / shares_outstanding if shares_outstanding > 0 else 0.0
        
        return {
            "enterprise_value": enterprise_value,
            "pv_of_cash_flows": pv_cash_flows,
            "pv_of_terminal_value": pv_terminal_value,
            "implied_share_price": implied_share_price,
            "assumptions": {
                "discount_rate": discount_rate,
                "terminal_growth_rate": terminal_growth_rate,
                "projection_years": n_years
            }
        }
        
    def calculate_multiples(self, enterprise_value: float, ebitda: float, 
                            market_cap: float, net_income: float, revenue: float) -> Dict[str, float]:
        """
        Calculates standard financial valuation multiples.
        """
        multiples = {}
        
        if ebitda and ebitda > 0:
            multiples["EV/EBITDA"] = enterprise_value / ebitda
            
        if net_income and net_income > 0:
            multiples["P/E"] = market_cap / net_income
            
        if revenue and revenue > 0:
            multiples["EV/Revenue"] = enterprise_value / revenue
            
        return multiples
