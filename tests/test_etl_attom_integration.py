import sys
from unittest.mock import patch, MagicMock

# Patch sys.modules for problematic imports before anything else
mock_modules = {
    'etl.narrpr_scraper': MagicMock(),
    'selenium': MagicMock(),
    'app': MagicMock(),
}
with patch.dict(sys.modules, mock_modules):
    import unittest
    with patch('etl.data_validation.fuzzy_deduplicate_records') as mock_fuzzy:
        from etl.attom_api_connector import AttomApiConnector

        class TestAttomETLIntegration(unittest.TestCase):
            @patch('etl.attom_api_connector.AttomApiConnector._make_request')
            def test_attom_etl_deduplication_thresholds(self, mock_make_request):
                # Mock ATTOM API response with near-duplicates
                mock_make_request.return_value = {
                    "property": [
                        {"attomid": "1", "address": {"street": "123 Main St", "city": "Seattle", "state": "WA", "zip": "98101"}},
                        {"attomid": "2", "address": {"street": "123 Main Street", "city": "Seattle", "state": "WA", "zip": "98101"}},
                        {"attomid": "3", "address": {"street": "124 Main St", "city": "Seattle", "state": "WA", "zip": "98101"}},
                        {"attomid": "4", "address": {"street": "123 Main St.", "city": "Seattle", "state": "WA", "zip": "98101"}},
                    ]
                }
                etl = AttomApiConnector(api_key="fake")
                # Simulate threshold 95: only exact near-duplicates merged
                mock_fuzzy.side_effect = lambda recs, address_field, threshold=95: [recs[0], recs[2]]
                results = etl.search_properties(address="123 Main St", city="Seattle", state="WA", zipcode="98101")
                self.assertEqual(len(results), 2)
                # Simulate threshold 92: more aggressive
                mock_fuzzy.side_effect = lambda recs, address_field, threshold=92: [recs[0]]
                results = etl.search_properties(address="123 Main St", city="Seattle", state="WA", zipcode="98101")
                self.assertEqual(len(results), 1)

        if __name__ == "__main__":
            unittest.main()
