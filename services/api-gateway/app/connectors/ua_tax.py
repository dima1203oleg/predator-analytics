"""
UA Tax Connector - Wrapper for tax data
Alias for tax.py with specialized methods
"""
from .tax import TaxConnector, tax_connector

# Re-export for backwards compatibility
UaTaxConnector = TaxConnector
ua_tax_connector = tax_connector
