"""
UA Customs Connector - Wrapper for customs statistics
Alias for customs.py with specialized methods
"""
from .customs import CustomsConnector, customs_connector

# Re-export for backwards compatibility
UaCustomsConnector = CustomsConnector
ua_customs_connector = customs_connector
